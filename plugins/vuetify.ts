import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    // Kept for SSR: Vuetify's remaining components (v-menu, v-tooltip,
    // v-skeleton-loader, etc.) render on the server, and ssr:true keeps their
    // output stable between the server render and the first client render.
    // (Responsive breakpoints no longer come from Vuetify — see
    // composables/useDisplay.ts, an SSR-safe replacement for useDisplay().)
    ssr: true,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
