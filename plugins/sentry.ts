import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // Initialize Sentry
  Sentry.init({
    app: nuxtApp.vueApp, // Attach to the Nuxt app
    dsn: config.public.sentryDsn, // Use DSN from runtime config
    tracesSampleRate: 1.0, // Adjust as needed for performance monitoring
    replaysSessionSampleRate: 0.1, // Adjust sample rates for replay
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with an error
  })

  // Capture and log errors in development
  if (process.env.NODE_ENV === 'development') {
    nuxtApp.hook('vue:error', (err) => {
      console.error('Captured Vue error:', err)
    })
  }
})
