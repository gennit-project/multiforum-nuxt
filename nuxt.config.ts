import { defineNuxtConfig } from 'nuxt/config';
import { config } from './config';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import path from 'path';
import { inMemoryCacheOptions } from './cache';

const isMockedE2E = process.env.VITE_E2E_MOCK_MODE === 'true';

export default defineNuxtConfig({
  srcDir: '.',
  app: {
    head: {
      title: config.serverDisplayName || 'Multiforum',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: `Welcome to ${config.serverDisplayName}`,
        },
        { name: 'color-scheme', content: 'dark light' },
      ],
      htmlAttrs: {
        lang: 'en',
        class: 'dark dark-mode-ready', // Default to dark mode for initial SSR
      },
    },
  },
  vue: {
    compilerOptions: {
      whitespace: 'preserve',
      isCustomElement: (tag) => tag === 'model-viewer',
    },
  },
  build: {
    transpile: ['vuetify'],
  },
  experimental: {
    payloadExtraction: false,
  },
  compatibilityDate: '2024-04-03',
  components: true,
  css: [
    'vuetify/styles',
    '@fortawesome/fontawesome-free/css/all.css',
    '@/assets/css/index.css',
  ],
  devtools: { enabled: true },
  imports: {
    autoImport: true,
  },
  modules: [
    '@sentry/nuxt/module',
    // SPIKE (auth0-nuxt server-session migration): registers /auth/login,
    // /auth/logout, /auth/callback, /auth/backchannel-logout. Config is read
    // from the private `runtimeConfig.auth0` block below (NUXT_AUTH0_* envs).
    // The mounted routes only require valid config when actually hit, so the
    // existing @auth0/auth0-vue SPA flow keeps working until this is wired in.
    ['@auth0/auth0-nuxt', { mountRoutes: true }],
    [
      '@nuxtjs/apollo',
      {
        clients: {
          default: {
            httpEndpoint: config?.graphqlUrl || '',
            tokenName: 'token',
            tokenStorage: 'localStorage',
            inMemoryCacheOptions,
            // Always get fresh token from localStorage on each request
            apolloLink: ({ uri }) => {
              // SSR path: build an HttpLink instead of `{ uri }`
              if (import.meta.client) {
                return import('@apollo/client/core').then(
                  async ({ HttpLink, from }) => {
                    const { setContext } =
                      await import('@apollo/client/link/context');
                    const { onError } =
                      await import('@apollo/client/link/error');

                    /* helper that returns a token or null */
                    const getToken = async (
                      force = false
                    ): Promise<string | null> => {
                      const fn = (globalThis as any).__auth0_getToken;
                      if (!fn) return null;
                      try {
                        return await fn(force ? { cacheMode: 'off' } : {});
                      } catch {
                        return null;
                      }
                    };

                    /* ---- authLink: attach a (fresh) token to every request ---- */
                    const authLink = setContext(async (_, { headers }) => {
                      const token =
                        (await getToken()) || localStorage.getItem('token');
                      return {
                        headers: {
                          ...headers,
                          ...(token && { Authorization: `Bearer ${token}` }),
                        },
                      };
                    });

                    /* ---- errorLink: retry once on 401/UNAUTHENTICATED ---- */
                    const { fromPromise } =
                      await import('@apollo/client/link/utils');
                    const errorLink = onError(
                      ({ graphQLErrors, networkError, forward, operation }) => {
                        const unauth =
                          (networkError &&
                            (networkError as any).statusCode === 401) ||
                          graphQLErrors?.some(
                            (e) => e.extensions?.code === 'UNAUTHENTICATED'
                          );

                        if (!unauth) return;

                        // Force‑refresh, bypassing the SDK cache
                        return fromPromise(
                          getToken(true)
                            .then((newToken) => {
                              if (!newToken)
                                throw new Error('silent refresh failed');
                              localStorage.setItem('token', newToken);

                              operation.setContext(({ headers = {} }) => ({
                                headers: {
                                  ...headers,
                                  Authorization: `Bearer ${newToken}`,
                                },
                              }));
                            })
                            .catch(() => {
                              // SSO cookie is gone → just reload; user either comes back in
                              // silently or is sent to /authorize.
                              window.location.reload();
                            })
                        ).flatMap(() => forward(operation));
                      }
                    );

                    const httpLink = new HttpLink({ uri });
                    return from([errorLink, authLink, httpLink]);
                  }
                );
              }

              // SSR path: plain link, no token
              return { uri };
            },

            devtools: { enabled: process.env.NODE_ENV === 'development' },
            defaultOptions: {
              watchQuery: {
                errorPolicy: 'all',
                notifyOnNetworkStatusChange: true,
                fetchPolicy: 'cache-first',
              },
              query: {
                errorPolicy: 'all',
                notifyOnNetworkStatusChange: true,
                fetchPolicy: 'cache-first',
              },
              mutation: {
                errorPolicy: 'all',
              },
            },
          },
        },
      },
    ],
    // Add image optimization
    [
      '@nuxt/image',
      {
        // Image quality options
        quality: 80,
        // Use WebP and AVIF formats where supported
        format: ['webp', 'avif', 'jpg', 'png'],
        // Provider for image generation
        provider: 'ipx',
        // Responsive image breakpoints
        screens: {
          xs: 320,
          sm: 640,
          md: 768,
          lg: 1024,
          xl: 1280,
          xxl: 1536,
          '2xl': 1536,
        },
        // Default image optimization options
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 'auto',
          height: 'auto',
        },
        // Domains to allow for remote images
        domains: ['storage.googleapis.com'],
        // Adjust placeholder behavior
        placeholder: {
          size: 10,
        },
        // Presets for common image types
        presets: {
          avatar: {
            modifiers: {
              format: 'webp',
              width: 50,
              height: 50,
            },
          },
          thumbnail: {
            modifiers: {
              format: 'webp',
              width: 320,
              height: 180,
            },
          },
          cover: {
            modifiers: {
              format: 'webp',
              width: 1200,
              height: 630,
            },
          },
        },
      },
    ],
    // Light/dark mode support
    '@nuxtjs/color-mode',
    // The order matters in this list. Tailwind must come last
    // to avoid its styles being overridden by other styles.
    [
      '@nuxtjs/tailwindcss',
      {
        cssPath: ['@/assets/css/index.css', { injectPosition: 'last' }],
        configPath: 'tailwind.config.js',
      },
    ],
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          Roboto: true,
          Inter: [400, 700],
          Montserrat: [400, 700],
        },
        display: 'swap',
        prefetch: true,
        preconnect: true,
      },
    ],
    [
      '@nuxtjs/i18n',
      {
        locales: [
          {
            code: 'en',
            name: 'English',
            file: 'en.yaml',
          },
          {
            code: 'es',
            name: 'Espanol',
            file: 'es.yaml',
          },
        ],
        defaultLocale: 'en',
        lazy: true,
        langDir: 'locales',
        strategy: 'no_prefix',
        detectBrowserLanguage: {
          useCookie: true,
          cookieKey: 'i18n_redirected',
          fallbackLocale: 'en',
        },
      },
    ],
  ],
  sentry: {
    dsn: process.env.VITE_SENTRY_DSN,
    authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
    environment: process.env.VITE_ENVIRONMENT || 'development',
    integrations: ['replayIntegration'],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    sourceMapsUploadOptions: {
      org: 'none-y1x',
      project: 'javascript-nuxt',
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
    },
  },
  nitro: {
    preset: 'vercel',
    // Enable CDN caching
    cdn: true,
    // Enable server-side caching
    routeRules: {
      // Cache server-rendered discussion pages. The SSR output is anonymous
      // (auth runs client-side only, so the server never personalizes the
      // HTML), which makes it identical for every visitor and safe to cache.
      // On Vercel this becomes ISR: the page renders on demand, is served
      // from the edge (~5ms vs ~2s SSR), and revalidates in the background
      // every 300s. Note: the single-segment glob is required — a mid-path
      // `**` (e.g. /forums/**/discussions/**) corrupts Nitro's route matcher
      // and 404s the route.
      '/forums/*/discussions/*': { isr: 300 },
      // Event and download detail pages render the same way: public, anonymous
      // SSR (auth is client-side), so they cache identically for every visitor.
      // Downloads are discussions with hasDownload=true and reuse the same
      // components, so they also inherit the flattened query waves.
      '/forums/*/events/*': { isr: 300 },
      '/forums/*/downloads/*': { isr: 300 },
      // Cache API routes
      '/api/**': {
        cache: {
          // Let middleware handle specific cache times
          headers: ['cache-control'],
        },
      },
      // Cache static assets
      '/_nuxt/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
      // Cache public assets
      '/assets/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable',
        },
      },
    },
  },
  plugins: [
    { src: '@/plugins/pinia', mode: 'all' },
    { src: '@/plugins/google-maps', mode: 'client' },
    { src: '@/plugins/vuetify', mode: 'all' },
    { src: '@/plugins/performance.client', mode: 'client' },
    { src: '@/plugins/click-outside.client', mode: 'client' },
    { src: '@/plugins/accented.client', mode: 'client' },
    { src: '@/plugins/test-auth.client', mode: 'client' },
  ],
  runtimeConfig: {
    // SPIKE (auth0-nuxt server-session migration): server-only Auth0 config.
    // These are overridden by NUXT_AUTH0_* env vars at runtime (see
    // .env.auth0-nuxt.example). clientSecret + sessionSecret mean this is a
    // CONFIDENTIAL "Regular Web Application" in Auth0 — a different app type
    // than the current SPA. Empty defaults are intentional: the module only
    // needs them when an /auth/* route is hit, so dev still boots without them.
    auth0: {
      domain: '',
      clientId: '',
      clientSecret: '',
      sessionSecret: '',
      appBaseUrl: 'http://localhost:3000',
      audience: '',
    },
    public: {
      apollo: {
        clients: {
          default: {
            httpEndpoint: config?.graphqlUrl || '',
          },
        },
      },
      googleMapsApiKey: config?.googleMapsApiKey,
      auth0Domain: config?.domain,
      auth0ClientId: config?.clientId,
      auth0CallbackUrl: config?.callbackUrl,
      auth0Url: config?.auth0Url,
      auth0Audience: config?.auth0Audience,
      enableLanguagePicker: config?.enableLanguagePicker || false,
      enableAccented:
        process.env.NUXT_PUBLIC_ENABLE_ACCENTED === 'false' ? false : true,
    },
  },
  ssr: !isMockedE2E,
  // Emit client source maps for the E2E coverage build so browser V8 coverage
  // can be mapped back to original source (spike: E2E_COVERAGE=true).
  sourcemap: {
    client: process.env.E2E_COVERAGE === 'true',
  },
  typescript: {
    strict: false,
    shim: true,
    typeCheck: false,
  },
  vite: {
    plugins: [vuetify({ autoImport: true })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname),
        'fast-deep-equal': 'fast-deep-equal/es6/index.js',
      },
    },
    define: {
      global: 'globalThis',
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    // Allow connections from ngrok for mobile testing
    server: {
      allowedHosts: ['localhost', '69f8-98-168-53-208.ngrok-free.app'],
    },
    build: {
      minify: false,
      cssMinify: false,
      // terserOptions: {
      //   compress: {
      //     drop_console: process.env.NODE_ENV === 'production',
      //     drop_debugger: process.env.NODE_ENV === 'production'
      //   }
      // },
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-libs': ['vue', 'vue-router', 'pinia'],
            'ui-libs': ['vuetify'],
            apollo: ['@apollo/client', '@vue/apollo-composable'],
            'date-libs': ['luxon'],
            'map-libs': ['@googlemaps/js-api-loader'],
            '3d-libs': ['three', '@google/model-viewer'],
          },
        },
      },
    },
    optimizeDeps: {
      // Scan all pages so Vite discovers and pre-bundles every third-party
      // dependency upfront. Without this, the first client-side navigation to a
      // route whose components import a new (not yet pre-bundled) package causes
      // Vite to return 504 "Outdated Optimize Dep" responses, aborting the
      // router.push navigation (visible in CI as the createEditChannels test
      // timing out at the toHaveURL assertion).
      entries: ['./pages/**/*.vue'],
      include: [
        'vue',
        'vue-router',
        '@vue/apollo-composable',
        'luxon',
        'three',
        '@google/model-viewer',
      ],
    },
  },
});
