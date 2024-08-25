import { defineNuxtConfig } from "nuxt/config";
import config from "./config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  components: true,
  css: [
    "@/assets/css/index.css",
    "@fortawesome/fontawesome-free/css/all.css",
    "codemirror/lib/codemirror.css",
    "codemirror/addon/scroll/simplescrollbars.css",
    "@kangc/v-md-editor/lib/style/preview.css",
    "@kangc/v-md-editor/lib/style/codemirror-editor.css",
  ],
  // Enable auto-imports globally
  imports: {
    autoImport: true,
  },
  ssr: true,
  // Global CSS
  
  plugins: [
    { src: "@/plugins/sentry", mode: "client" },
    { src: "@/plugins/google-maps", mode: "client" },
    { src: "@/plugins/apollo", mode: "client" },
  ],
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
  modules: ["@nuxtjs/apollo"],
  apollo: {
    clients: {
      default: {
        httpEndpoint: config.graphqlUrl,
      }
    },
  },

  // FontAwesome icons
  buildModules: ["@nuxtjs/fontawesome", "@nuxtjs/vuetify"],

  fontawesome: {
    component: "fa",
    icons: {
      solid: [
        "faArrowsRotate",
        "faCircleCheck",
        "faComment",
        "faEye",
        "faEyeSlash",
        "faFaceSmile",
        "faFlag",
        "faSun",
        "faMoon",
        "faChevronDown",
        "faDesktop",
        "faTicket",
        "faFire",
        "faImage",
        "faUserLock",
        "faUserMinus",
        "faUserPlus",
        "faXmark",
        "faArrowUpRightFromSquare",
      ],
    },
  },

  // Runtime Config
  runtimeConfig: {
    public: {
      googleMapsApiKey: config.googleMapsApiKey,
    },
  },

  // Sentry
  sentry: {
    dsn: config.sentryDsn,
    tracing: true,
    config: {}, // Sentry configuration options
  },
});
