import * as Sentry from '@sentry/nuxt';

const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
const isProduction = environment === 'production';

Sentry.init({
  // Runtime options must live here (and in sentry.server.config.ts), not in the
  // `sentry` block of nuxt.config.ts — that block is only read for build-time
  // module options (source maps upload), so runtime options placed there are
  // silently ignored.
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment,
  integrations: [Sentry.replayIntegration()],
  // Performance tracing — sample everything outside production to keep noise low.
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  // Session Replay sampling.
  replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
});
