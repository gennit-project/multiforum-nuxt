import { defineNuxtConfig } from "nuxt/config";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  // Enable auto-imports globally
  imports: {
    autoImport: true,
  },
  ssr: true,
  // Global CSS
  css: [
    "@/assets/css/index.css",
    "@fortawesome/fontawesome-free/css/all.css",
    "codemirror/lib/codemirror.css",
    "codemirror/addon/scroll/simplescrollbars.css",
    "@kangc/v-md-editor/lib/style/preview.css",
    "@kangc/v-md-editor/lib/style/codemirror-editor.css",
  ],
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
        httpEndpoint: process.env.GRAPHQL_URL,
        tokenName: "apollo-token",
        defaultOptions: {
          $query: {
            fetchPolicy: "network-only",
          },
        },
      },
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
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracing: true,
    config: {}, // Sentry configuration options
  },
});
