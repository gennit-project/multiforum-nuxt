import { defineNuxtConfig } from "nuxt/config";
import config from "./config";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import path from "path";

export default defineNuxtConfig({
  alias: {
    "@": path.resolve(__dirname),
  },
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
            httpEndpoint: config.graphqlUrl || "",
            tokenName: "token",
            tokenStorage: "localStorage",
          },
        },
      },
    ],
    "@nuxtjs/eslint-module",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
  ],
  nitro: {
    preset: "node",
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
            httpEndpoint: config.graphqlUrl || "",
          },
        },
      },
      googleMapsApiKey: config.googleMapsApiKey,
      auth0Domain: config.domain,
      auth0ClientId: config.clientId,
      auth0CallbackUrl: config.callbackUrl,
      auth0Url: config.auth0Url,
      auth0Audience: config.auth0Audience,
      auth0Scope: config.auth0Scope,
    },
  },
  ssr: true,
  typescript: {
    strict: true,
    shim: false,
    typeCheck: true,
  },
  vite: {
    plugins: [vuetify({ autoImport: true })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname),
        "@/components": path.resolve(__dirname, "components"),
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
