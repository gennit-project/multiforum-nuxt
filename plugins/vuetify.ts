import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    // REQUIRED for SSR. Without it, useDisplay() (lgAndUp / mdAndUp / smAndDown,
    // used for responsive nav rendering in layouts/default.vue, TopNav.vue,
    // ChannelTabs.vue, etc.) resolves to an inconsistent viewport width between
    // the server render and the client's first hydration render, so the
    // responsive `v-if` branches flip and Vue reports "Hydration completed but
    // contains mismatches" — the cascading nav/layout mismatch on discussion
    // pages. With ssr:true Vuetify renders a stable default on both server and
    // first client render, then updates the real breakpoints after mount.
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
