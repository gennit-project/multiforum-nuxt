import * as Sentry from '@sentry/nuxt';

const environment = process.env.VITE_ENVIRONMENT || 'development';
const isProduction = environment === 'production';

Sentry.init({
  // Runtime options must live here (and in sentry.client.config.ts), not in the
  // `sentry` block of nuxt.config.ts — that block is only read for build-time
  // module options (source maps upload), so runtime options placed there are
  // silently ignored. Session Replay is client-only, so it is not configured here.
  dsn: process.env.VITE_SENTRY_DSN,
  environment,
  tracesSampleRate: isProduction ? 0.1 : 1.0,
});
