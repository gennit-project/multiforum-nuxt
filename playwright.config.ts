import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? '3100';
const backendPort = process.env.PLAYWRIGHT_BACKEND_PORT ?? '4100';
const baseURL = `http://127.0.0.1:${frontendPort}`;
const graphqlURL = `http://127.0.0.1:${backendPort}/graphql`;
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
            NEO4J_URI: process.env.NEO4J_URI ?? 'bolt://127.0.0.1:7688',
            NEO4J_USER: process.env.NEO4J_USER ?? 'neo4j',
            E2E_MOCK_AUTH: 'true',
            GOOGLE_CREDENTIALS_BASE64: '',
            PLAYWRIGHT_MOCK_AUTH: 'true',
            PORT: backendPort,
          },
          url: `http://127.0.0.1:${backendPort}`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          name: 'frontend',
          command: `npx nuxt dev --host 127.0.0.1 --port ${frontendPort}`,
          env: {
            VITE_E2E_MOCK_MODE: 'true',
            VITE_GRAPHQL_URL: graphqlURL,
          },
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
