import { defineNuxtConfig } from "nuxt/config";
import config from "./config";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
declare module '@nuxt/schema' {
  interface NuxtConfig {
    apollo?: {
      clients?: {
        default: {
          httpEndpoint: string
        }
      }
    }
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  apollo: {
    clients: {
      default: {
        httpEndpoint: config.graphqlUrl || ''
      }
    }
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
    "@nuxtjs/apollo",
    "@nuxtjs/eslint-module",
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],
  nitro: {
    preset: 'vercel'
  },
  plugins: [
    { src: "@/plugins/sentry", mode: "client" },
    { src: "@/plugins/google-maps", mode: "client" },
    { src: "@/plugins/apollo", mode: "client" },
    { src: "@/plugins/vuetify", mode: "all" },
  ],
  runtimeConfig: {
    // Public config, available on both client and server
    public: {
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
  vite: {
    resolve: {
      alias: {
        "fast-deep-equal": "fast-deep-equal/index.js",
      },
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
