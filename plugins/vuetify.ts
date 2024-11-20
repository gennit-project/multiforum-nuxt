
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import createVuetify from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin((nuxtApp: any) => {
  const vuetify = createVuetify({
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})
