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
      }
  }],
  ],
  nitro: { preset: "vercel"},
  plugins: [
    { src: "@/plugins/pinia", mode: "all" },
    { src: "@/plugins/sentry", mode: "client" },
    { src: "@/plugins/google-maps", mode: "client" },
    { src: "@/plugins/vuetify", mode: "all" },
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
  },
});
