import { defineNuxtConfig } from "nuxt/config";
import config from "./config";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import path from "path";

// Log the directory contents of components/nav
console.log('Nav folder contents:', fs.readdirSync(path.resolve(__dirname, 'components/nav')));


// https://nuxt.com/docs/api/configuration/nuxt-config
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
          },
        },
      },
    ],
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
    preset: "node",
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
    resolve: {
      alias: {
        "@": path.resolve(__dirname),
        "@/components": path.resolve(__dirname, "components"),
      },
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
});
