import { defineNuxtConfig } from "nuxt/config";
import { config } from "./config";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import path from "path";
import { inMemoryCacheOptions } from "./cache";

export default defineNuxtConfig({
  app: {
    head: {
      title: config.serverDisplayName,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: `Welcome to ${config.serverDisplayName}` },
        { name: 'color-scheme', content: 'dark light' }
      ],
      htmlAttrs: {
        class: 'dark dark-mode-ready'  // Default to dark mode for initial SSR
      }
    }
  },
  vue: {
    compilerOptions: {
      whitespace: 'preserve',
      warnExplicitImportCheck: false // This suppresses warnings about explicit imports of compiler macros
    }
  },
  build: {
    transpile: ["vuetify"],
    minify: true,
    // Extract CSS
    cssMinify: true,
    // Improve chunking strategy
    chunkSizeWarningLimit: 1000,
    optimization: {
      splitChunks: {
        maxSize: 300000,
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.(css|vue)$/,
            chunks: 'all',
            enforce: true
          }
        }
      }
    }
  },
  experimental: {
    payloadExtraction: true,
  },
  optimization: {
    splitChunks: {
      maxSize: 300000,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
      },
    },
  },
  compatibilityDate: "2024-04-03",
  components: true,
  css: [
    "vuetify/styles",
    "@fortawesome/fontawesome-free/css/all.css",
    "@/assets/css/index.css",
  ],
  devtools: { enabled: true },
  imports: {
    autoImport: true,
  },
  modules: [
    [
      "@nuxtjs/apollo",
      {
        clients: {
          default: {
            httpEndpoint: config?.graphqlUrl || "",
            tokenName: "token", 
            tokenStorage: "localStorage",
            inMemoryCacheOptions,
            // Always get fresh token from localStorage on each request
            apolloLink: ({ uri }) => {
              // Only run client-side
              if (import.meta.client) {
                return import('@apollo/client/core').then(({ ApolloLink, HttpLink, from }) => {
                  // Create regular HTTP link
                  const httpLink = new HttpLink({ uri });
                  
                  // Create auth middleware that adds the token to each request
                  const authMiddleware = new ApolloLink((operation, forward) => {
                    // Get the latest token from localStorage on every request
                    const token = localStorage.getItem('token');
                    
                    // Set auth header if token exists
                    if (token) {
                      operation.setContext({
                        headers: {
                          Authorization: `Bearer ${token}`
                        }
                      });
                    }
                    
                    return forward(operation);
                  });
                  
                  // Return the combined link
                  return from([authMiddleware, httpLink]);
                });
              }
              
              // Server-side, use regular link
              return { uri };
            },
            defaultOptions: {
              watchQuery: {
                errorPolicy: 'all',
                notifyOnNetworkStatusChange: true,
              },
              query: {
                errorPolicy: 'all',
                notifyOnNetworkStatusChange: true,
              },
              mutation: {
                errorPolicy: 'all',
              },
            },
            // Add global error handler to detect expired tokens and retry operations
            onError: async (error) => {
              // Check if the error is related to authentication
              const isAuthError = error.graphQLErrors?.some(e => 
                e.message.includes('expired') || 
                e.message.includes('authentication') ||
                e.message.includes('unauthorized') ||
                e.message.includes('session')
              );
              
              if (isAuthError && window.refreshAuthToken) {
                console.log('Auth error detected, attempting to refresh token');
                const refreshSucceeded = await window.refreshAuthToken();
                if (refreshSucceeded) {
                  console.log('Token refreshed, operation can be retried');
                  // The user will need to retry their action, but with a fresh token
                }
              }
            },
          },
        },
      },
    ],
    // Add image optimization
    ['@nuxt/image', {
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
        '2xl': 1536
      },
      // Default image optimization options
      modifiers: {
        format: 'webp',
        quality: 80,
        width: 'auto',
        height: 'auto'
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
          }
        },
        thumbnail: {
          modifiers: {
            format: 'webp',
            width: 320,
            height: 180,
          }
        },
        cover: {
          modifiers: {
            format: 'webp',
            width: 1200,
            height: 630,
          }
        }
      }
    }],
    // Light/dark mode support
    "@nuxtjs/color-mode",
    // The order matters in this list. Tailwind must come last
    // to avoid its styles being overridden by other styles.
    [
      "@nuxtjs/tailwindcss",
      {
        cssPath: ["@/assets/css/index.css", { injectPosition: "last" }],
        configPath: "tailwind.config.js",
      },
    ],
    ['@nuxtjs/google-fonts', {
      families: {
        Roboto: true,
        Inter: [400, 700],
        Montserrat: [400, 700],
      },
      display: 'swap',
      prefetch: true,
      preconnect: true,
  }],
  ],
  nitro: { 
    preset: "vercel",
    // Enable CDN caching
    cdn: true,
    // Enable server-side caching
    routeRules: {
      // Cache API routes
      '/api/**': { 
        cache: { 
          // Let middleware handle specific cache times
          headers: ['cache-control']
        }
      },
      // Cache static assets
      '/_nuxt/**': { 
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      },
      // Cache public assets
      '/assets/**': { 
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      }
    }
  },
  plugins: [
    { src: "@/plugins/pinia", mode: "all" },
    { src: "@/plugins/sentry", mode: "client" },
    { src: "@/plugins/google-maps", mode: "client" },
    { src: "@/plugins/vuetify", mode: "all" },
    { src: "@/plugins/performance.client", mode: "client" },
  ],
  runtimeConfig: {
    public: {
      apollo: {
        clients: {
          default: {
            httpEndpoint: config?.graphqlUrl || "",
          },
        },
      },
      googleMapsApiKey: config?.googleMapsApiKey,
      auth0Domain: config?.domain,
      auth0ClientId: config?.clientId,
      auth0CallbackUrl: config?.callbackUrl,
      auth0Url: config?.auth0Url,
      auth0Audience: config?.auth0Audience,
    },
  },
  ssr: true,
  typescript: {
    strict: false,
    shim: true,
    typeCheck: false,
  },
  vite: {
    plugins: [vuetify({ autoImport: true })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname),
        "fast-deep-equal": "fast-deep-equal/es6/index.js",
      },
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    build: {
      minify: 'terser',
      cssMinify: true,
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: process.env.NODE_ENV === 'production'
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-libs': ['vue', 'vue-router', 'pinia'],
            'ui-libs': ['vuetify'],
            'apollo': ['@apollo/client', '@vue/apollo-composable'],
            'date-libs': ['luxon'],
            'map-libs': ['@googlemaps/js-api-loader']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', '@vue/apollo-composable', 'luxon']
    }
  },
});
