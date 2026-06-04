import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseURL = 'http://127.0.0.1:3000';
const skipWebServer = process.env.PW_SKIP_WEBSERVER === 'true';
const repoRoot = dirname(fileURLToPath(import.meta.url));
const backendCandidates = [
  resolve(repoRoot, 'gennit-backend'),
  resolve(repoRoot, '../gennit-backend'),
  resolve(repoRoot, '../../gennit-backend'),
];
const backendRoot =
  process.env.PLAYWRIGHT_BACKEND_CWD ??
  backendCandidates.find((candidate) => existsSync(candidate)) ??
  backendCandidates[0];

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60_000,
  workers: 1,
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
            AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ?? 'playwright-test-client',
            AUTH0_DOMAIN: process.env.AUTH0_DOMAIN ?? 'example.com',
            CYPRESS_ADMIN_TEST_EMAIL:
              process.env.CYPRESS_ADMIN_TEST_EMAIL ?? 'catherine.luse@gmail.com',
            CYPRESS_ADMIN_TEST_USERNAME:
              process.env.CYPRESS_ADMIN_TEST_USERNAME ?? 'cluse',
            NEO4J_PASSWORD: process.env.NEO4J_PASSWORD ?? 'playwright-ci-password',
            NEO4J_URI: process.env.NEO4J_URI ?? 'bolt://127.0.0.1:7687',
            NEO4J_USER: process.env.NEO4J_USER ?? 'neo4j',
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
