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
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: `Welcome to ${config.serverDisplayName}` },
        { name: "color-scheme", content: "dark light" },
      ],
      htmlAttrs: {
        class: "dark-mode-ready", // Remove forced dark mode to prevent SSR hydration mismatch
      },
    },
  },
  vue: {
    compilerOptions: {
      whitespace: "preserve",
      isCustomElement: (tag) => tag === "model-viewer",
    },
  },
  build: {
    transpile: ["vuetify"],
  },
  compatibilityDate: "2024-04-03",
  components: true,
  css: ["vuetify/styles", "@fortawesome/fontawesome-free/css/all.css", "@/assets/css/index.css"],
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
                return import("@apollo/client/core").then(({ ApolloLink, HttpLink, from }) => {
                  // Create regular HTTP link
                  const httpLink = new HttpLink({ uri });

                  // Create auth middleware that adds the token to each request
                  const authMiddleware = new ApolloLink((operation, forward) => {
                    // Get the latest token from localStorage on every request
                    const token = localStorage.getItem("token");

                    // Set auth header if token exists
                    if (token) {
                      operation.setContext({
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      });
                    }

                    return forward(operation).map((result) => {
                      // Handle successful responses
                      return result;
                    });
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
                errorPolicy: "all",
                notifyOnNetworkStatusChange: true,
                fetchPolicy: "cache-first",
              },
              query: {
                errorPolicy: "all",
                notifyOnNetworkStatusChange: true,
                fetchPolicy: "cache-first",
              },
              mutation: {
                errorPolicy: "all",
              },
            },
            // Add global error handler to detect expired tokens and retry operations
            onError: async (error) => {
              // Ignore canceled requests to prevent console spam
              if (error.networkError?.name === "AbortError" || 
                  error.networkError?.message?.includes("aborted") ||
                  error.networkError?.message?.includes("canceled")) {
                return;
              }

              // Check if the error is related to authentication
              const isAuthError = error.graphQLErrors?.some(
                (e) =>
                  e.message.includes("expired") ||
                  e.message.includes("authentication") ||
                  e.message.includes("unauthorized") ||
                  e.message.includes("session")
              );

              if (isAuthError && window.refreshAuthToken) {
                console.log("Auth error detected, attempting to refresh token");
                const refreshSucceeded = await window.refreshAuthToken();
                if (refreshSucceeded) {
                  console.log("Token refreshed, operation can be retried");
                  // The user will need to retry their action, but with a fresh token
                } else {
                  console.log("Token refresh failed, user may need to log in again");

                  // Check if we still have a valid session by examining Auth0 state
                  // Since we can't access the Auth0 object directly here, we'll check localStorage
                  const auth0State = localStorage.getItem("auth0.is.authenticated");

                  if (auth0State !== "true") {
                    // User is likely logged out or has invalid tokens
                    console.log("Auth0 session is invalid, redirecting to home page");

                    // If on a protected page, redirect to home
                    if (window.location.pathname !== "/") {
                      window.location.href = "/";
                    }
                  }
                }
              }
            },
          },
        },
      },
    ],
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
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          Roboto: true,
          Inter: [400, 700],
          Montserrat: [400, 700],
        },
        display: "swap",
        prefetch: true,
        preconnect: true,
      },
    ],
  ],
  nitro: { preset: "vercel" },
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
    // Allow connections from ngrok for mobile testing
    server: {
      allowedHosts: ["localhost", "69f8-98-168-53-208.ngrok-free.app"],
    },
    build: {
      minify: true,
      cssMinify: true,
    },
    optimizeDeps: {
      include: ["vue", "vue-router", "@vue/apollo-composable", "luxon"],
    },
  },
});
