import * as Sentry from '@sentry/nuxt';

Sentry.init({
  // This will be set by the Nuxt module based on the VITE_SENTRY_DSN environment variable
  // Additional client-side configuration can be added here if needed
});