import { defineConfig, devices } from '@playwright/test';

/**
 * SPIKE: opt-in config for collecting browser V8 coverage from the mocked E2E
 * suite. Separate from the normal runs so it never executes in regular CI.
 *
 * Prerequisite: build the SPA in mock mode WITH client source maps so coverage
 * can be mapped back to source:
 *   E2E_COVERAGE=true NITRO_PRESET=node-server VITE_E2E_MOCK_MODE=true \
 *   VITE_GRAPHQL_URL=http://127.0.0.1:4100/graphql \
 *   VITE_SERVER_NAME='Playwright Test Server' VITE_SENTRY_AUTH_TOKEN='' \
 *   npm run build
 *
 * Then:
 *   npx playwright test --config playwright.coverage.config.ts   # writes raw V8
 *   node tests/playwright/coverage/report.mjs                    # source-mapped report
 *
 * The collector lives in tests/playwright/coverage/. To collect across the full
 * mocked suite (the real win), set testDir to tests/playwright/mocked and wrap
 * its `test` with a coverage fixture — see docs/e2e-coverage-spike.md.
 */
const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '3100';
const baseURL = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: './tests/playwright/coverage',
  timeout: 60_000,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'off',
    headless: true,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    env: {
      NITRO_PORT: frontendPort,
      NITRO_HOST: '127.0.0.1',
      VITE_E2E_MOCK_MODE: 'true',
      VITE_GRAPHQL_URL: `http://127.0.0.1:${process.env.PLAYWRIGHT_BACKEND_PORT ?? '4100'}/graphql`,
      VITE_SERVER_NAME: 'Playwright Test Server',
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
