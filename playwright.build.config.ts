import { defineConfig, devices } from '@playwright/test';

/**
 * EXPERIMENTAL build-based, parallel Playwright config for the mocked suite.
 *
 * The default `playwright.config.ts` serves the app with `nuxt dev` and runs
 * with `workers: 1` / `fullyParallel: false`, because the dev server is
 * single-threaded and compiles routes on demand — concurrent requests cause
 * contention and route-compile races that make parallel runs flaky.
 *
 * The mocked suite never talks to a real backend (every GraphQL call is
 * intercepted per-page via `page.route`), and in mock mode the app is built as
 * a client-only SPA (`ssr: !isMockedE2E` in nuxt.config.ts). That means we can
 * serve a *production build* of the SPA from Nitro, which handles concurrent
 * requests cheaply and has no on-demand compilation — unlocking real
 * parallelism.
 *
 * Prerequisite: build the app in mock mode first, e.g.
 *   VITE_E2E_MOCK_MODE=true \
 *   VITE_GRAPHQL_URL=http://127.0.0.1:4100/graphql \
 *   VITE_SERVER_NAME='Playwright Test Server' \
 *   npx nuxt build
 *
 * Then run:  npx playwright test --config playwright.build.config.ts
 *
 * Override worker count with PLAYWRIGHT_WORKERS (defaults to 50% of cores).
 */

const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '3100';
const backendPort = process.env.PLAYWRIGHT_BACKEND_PORT ?? '4100';
const baseURL = `http://127.0.0.1:${frontendPort}`;
const graphqlURL = `http://127.0.0.1:${backendPort}/graphql`;
const skipWebServer = process.env.PW_SKIP_WEBSERVER === 'true';
const workers = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : '50%';

export default defineConfig({
  testDir: './tests/playwright/mocked',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  workers,
  fullyParallel: true,
  expect: {
    timeout: 30_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  webServer: skipWebServer
    ? undefined
    : {
        // Serve the pre-built Nitro output (client-only SPA in mock mode).
        command: `node .output/server/index.mjs`,
        env: {
          NITRO_PORT: frontendPort,
          NITRO_HOST: '127.0.0.1',
          VITE_E2E_MOCK_MODE: 'true',
          VITE_GRAPHQL_URL: graphqlURL,
          VITE_SERVER_NAME: 'Playwright Test Server',
          // Auth is mocked in this suite (VITE_E2E_MOCK_MODE seeds the session
          // from a cookie, see server/middleware/2.auth-session.ts), but the
          // @auth0/auth0-nuxt Nitro startup plugin still validates its config
          // and throws "Auth0 configuration error: Domain is required" on boot
          // when these are empty. These dummy NUXT_AUTH0_* values only satisfy
          // that check (runtimeConfig.auth0.*) — they are never used for real
          // authentication here.
          NUXT_AUTH0_DOMAIN: 'example.com',
          NUXT_AUTH0_CLIENT_ID: 'playwright-test-client',
          NUXT_AUTH0_CLIENT_SECRET: 'playwright-test-secret',
          NUXT_AUTH0_SESSION_SECRET: 'playwright-test-session-secret',
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
