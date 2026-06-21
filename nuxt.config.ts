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
    // Server-session auth: registers /auth/login, /auth/logout,
    // /auth/callback, /auth/backchannel-logout. Config is read from the private
    // `runtimeConfig.auth0` block below (NUXT_AUTH0_* envs).
    [
      '@auth0/auth0-nuxt',
      {
        mountRoutes: true,
        // SPIKE Phase 2: use a server-side session store (small cookie holds
        // only a session id). The default stateless cookie store overflows the
        // ~4KB browser limit once a refresh token is in the session. See the
        // factory for the dev (in-memory) vs prod (persistent) note.
        sessionStoreFactoryPath: '~/server/utils/session-store-factory.ts',
      },
    ],
    [
      '@nuxtjs/apollo',
      {
        clients: {
          default: {
            httpEndpoint: config?.graphqlUrl || '',
            // @nuxtjs/apollo attaches localStorage['token'] as the Bearer
            // (tokenStorage: 'localStorage'). plugins/apollo-auth.client.ts keeps
            // that key in sync with the server-session access token. (The old
            // custom `apolloLink` here was dead config — this module version
            // builds its own link and ignored it — so it was removed.)
            tokenName: 'token',
            tokenStorage: 'localStorage',
            inMemoryCacheOptions,

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
    // Persistent store for @auth0/auth0-nuxt server sessions
    // (server/utils/session-store-factory.ts uses useStorage('auth0Sessions')).
    // The default in-memory store is wiped on every server restart, leaving the
    // browser with a stale session-id cookie whose id is no longer in the store;
    // StatefulStateStore then DELETES the cookie on that miss and the user is
    // silently logged out. A persistent, shared store survives restarts and (on
    // serverless) is shared across function instances, avoiding that cascade.
    //
    // Production (Vercel) uses Upstash Redis over its REST API — no persistent
    // TCP connections, so it fits the serverless model. The driver reads
    // UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from the environment at
    // runtime (set these in the Vercel project). `ttl` (seconds) bounds orphaned
    // entries: each session refresh re-`set`s the key and resets its TTL, so
    // active sessions stay alive while abandoned ones expire after 30 days.
    storage: {
      auth0Sessions: {
        driver: 'upstash',
        base: 'auth0Sessions',
        ttl: 60 * 60 * 24 * 30, // 30 days
      },
      // Per-email cache of the stable auth profile (username / mod name /
      // avatar), so server/middleware/2.auth-session.ts doesn't re-run the full
      // backend lookup on every authenticated request. Entries are written with
      // a per-item TTL (PROFILE_CACHE_TTL_SECONDS); the unread-notification
      // count is never cached here (fetched fresh per request).
      authProfileCache: {
        driver: 'upstash',
        base: 'authProfileCache',
      },
    },
    // Local dev keeps filesystem-backed mounts (no Upstash creds needed) that
    // still survive `nuxt dev` restarts. devStorage overrides the production
    // mounts above only during development.
    devStorage: {
      auth0Sessions: {
        driver: 'fs',
        base: './.auth0-sessions',
      },
      authProfileCache: {
        driver: 'upstash',
        base: 'authProfileCache',
      },
    },
    // Enable server-side caching
    routeRules: {
      // Forum detail pages (discussions / events / downloads) are NOT cached.
      // Since the server-session migration, SSR is AUTH-AWARE: the server
      // personalizes the HTML from the user's session (edit/owner controls,
      // vote state, nav). A shared ISR/edge cache would capture ONE user's
      // personalized render and serve it to everyone — producing hydration
      // mismatches (cached auth state != the visitor's real auth state, causing
      // the page to blank and re-render) and leaking that user's auth state to
      // others. These must render on demand per request.
      //
      // (Before the migration SSR was anonymous, so ISR was safe; that premise
      // no longer holds. If per-page caching is wanted back, it would need to be
      // anonymous-only — e.g. bypass the cache whenever a session cookie is
      // present — not a blanket ISR rule.)
      // SPIKE Phase 2: auth endpoints must NOT be route-cached. Nitro's route
      // cache serves shared, cookie-independent responses, so /api/auth/token
      // was reaching its handler with NO cookies (no session → null token →
      // "You must be logged in"). A more specific rule wins in Nitro, so this
      // disables caching for the auth routes only.
      '/api/auth/**': { cache: false },
      // Cache other API routes
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
      // Spread by the SDK into the session store's cookie options. The session
      // cookie defaults to Secure, which browsers don't reliably send over
      // http://localhost — so the session looked intermittently "lost" in dev.
      // Disable Secure in dev only; production (https) keeps Secure cookies.
      sessionConfiguration: {
        cookie: {
          secure: process.env.NODE_ENV === 'production',
        },
      },
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
