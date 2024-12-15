import { defineNuxtConfig } from "nuxt/config";
import { config } from "./config";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import path from "path";
import { inMemoryCacheOptions } from "./cache";

export default defineNuxtConfig({
  build: {
    transpile: ["vuetify"],
  },
  compatibilityDate: "2024-04-03",
  components: true,
  css: [
    "vuetify/styles",
    "@/assets/css/index.css",
    "@fortawesome/fontawesome-free/css/all.css",
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
          },
        },
      },
    ],
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
  ],
  nitro: {
    preset: "vercel",
  },
  plugins: [
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
      auth0Scope: config?.auth0Scope,
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
