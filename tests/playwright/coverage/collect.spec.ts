/**
 * SPIKE: collect browser V8 coverage while exercising real pages, to prove E2E
 * coverage can be mapped back to source and merged with unit coverage.
 * Run with the build-based config against a sourcemap build (E2E_COVERAGE=true).
 * Raw V8 coverage is written to tests/playwright/coverage/.v8 for the MCR report
 * script (tests/playwright/coverage/report.mjs) to process.
 */
import { test } from '../helpers/testFixture';
import { createBaseHandlers } from '../helpers/baseHandlers';
import fs from 'node:fs';
import path from 'node:path';

const V8_DIR = path.resolve('tests/playwright/coverage/.v8');

const PAGES = ['/library', '/account_settings', '/u/cluse/comments'];

test('spike: collect E2E coverage across key pages', async ({
  page,
  setupMockedPage,
}) => {
  await setupMockedPage({ username: 'cluse', handlers: createBaseHandlers() });

  await page.coverage.startJSCoverage({ resetOnNavigation: false });

  for (const url of PAGES) {
    await page.goto(url);
    // Give the SPA a moment to render/execute; ignore network-idle timeouts.
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);
  }

  const coverage = await page.coverage.stopJSCoverage();

  fs.mkdirSync(V8_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(V8_DIR, 'coverage.json'),
    JSON.stringify(coverage)
  );
});
