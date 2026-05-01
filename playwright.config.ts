import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseURL = 'http://127.0.0.1:3000';
const skipWebServer = process.env.PW_SKIP_WEBSERVER === 'true';
const repoRoot = dirname(fileURLToPath(import.meta.url));
const backendRoot =
  process.env.PLAYWRIGHT_BACKEND_CWD ??
  (existsSync(resolve(repoRoot, 'gennit-backend'))
    ? resolve(repoRoot, 'gennit-backend')
    : resolve(repoRoot, '../gennit-backend'));

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
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
    : [
        {
          name: 'backend',
          command: 'node ./ts_emitted/index.js',
          cwd: backendRoot,
          env: {
            PLAYWRIGHT_MOCK_AUTH: 'true',
          },
          url: 'http://127.0.0.1:4000',
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          name: 'frontend',
          command: 'npm run dev:mocked',
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
