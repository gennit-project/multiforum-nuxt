import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  checkRouteBudgets,
  collectRouteMetrics,
  evaluateBudgets,
  findBuildArtifacts,
  formatBytes,
  renderReport,
} from './check-route-budgets.mjs';

const makeAssets = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'route-budget-'));
  fs.writeFileSync(path.join(directory, 'entry.js'), 'const value = 1;\n');
  fs.writeFileSync(
    path.join(directory, 'entry.css'),
    '.page { color: red; }\n'
  );
  return directory;
};

test('collectRouteMetrics deduplicates files and separates JS from CSS', () => {
  const assetsDirectory = makeAssets();
  const metrics = collectRouteMetrics({
    assetsDirectory,
    dependency: {
      preload: {
        entry: { file: 'entry.js', resourceType: 'script' },
        duplicate: { file: 'entry.js', resourceType: 'script' },
        styles: { file: 'entry.css', resourceType: 'style' },
      },
    },
  });

  assert.deepEqual(
    {
      preloadFiles: metrics.preloadFiles,
      jsFiles: metrics.jsFiles,
      cssFiles: metrics.cssFiles,
      rawBytes: metrics.rawBytes,
      gzipMatchesParts:
        metrics.gzipBytes === metrics.jsGzipBytes + metrics.cssGzipBytes,
    },
    {
      preloadFiles: 2,
      jsFiles: 1,
      cssFiles: 1,
      rawBytes: 39,
      gzipMatchesParts: true,
    }
  );
});

test('evaluateBudgets reports only exceeded limits', () => {
  const failures = evaluateBudgets(
    { preloadFiles: 5, gzipBytes: 101 },
    { preloadFiles: 5, gzipBytes: 100 }
  );

  assert.deepEqual(failures, [
    { metric: 'gzipBytes', actual: 101, limit: 100 },
  ]);
});

test('evaluateBudgets rejects unknown metrics', () => {
  assert.throws(
    () => evaluateBudgets({ gzipBytes: 10 }, { mysteryBytes: 10 }),
    /Unknown route-budget metric/
  );
});

test('evaluateBudgets rejects negative limits', () => {
  assert.throws(
    () => evaluateBudgets({ gzipBytes: 10 }, { gzipBytes: -1 }),
    /Invalid limit/
  );
});

test('collectRouteMetrics rejects a route without preload data', () => {
  assert.throws(
    () => collectRouteMetrics({ dependency: {}, assetsDirectory: '/tmp' }),
    /no preload data/
  );
});

test('collectRouteMetrics identifies a missing emitted asset', () => {
  const assetsDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'route-budget-assets-')
  );

  assert.throws(
    () =>
      collectRouteMetrics({
        assetsDirectory,
        dependency: {
          preload: {
            missing: { file: 'missing.js', resourceType: 'script' },
          },
        },
      }),
    /Preloaded asset is missing/
  );
});

test('findBuildArtifacts gives an actionable error without a build', () => {
  const repositoryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'route-budget-repository-')
  );

  assert.throws(() => findBuildArtifacts(repositoryRoot), /pnpm run build/);
});

test('formatBytes uses compact decimal kilobytes', () => {
  assert.equal(formatBytes(125500), '125.5kB');
});

test('checkRouteBudgets reads a node-server manifest and evaluates its route', async () => {
  const repositoryRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'route-budget-repository-')
  );
  const manifestDirectory = path.join(
    repositoryRoot,
    '.output/server/chunks/build'
  );
  const assetsDirectory = path.join(repositoryRoot, '.output/public/_nuxt');
  fs.mkdirSync(manifestDirectory, { recursive: true });
  fs.mkdirSync(assetsDirectory, { recursive: true });
  fs.writeFileSync(path.join(assetsDirectory, 'route.js'), 'export default 1;');
  fs.writeFileSync(path.join(assetsDirectory, 'route.css'), '.route{}');
  fs.writeFileSync(
    path.join(manifestDirectory, 'client.precomputed.mjs'),
    `export default ${JSON.stringify({
      dependencies: {
        'pages/parent.vue': {
          preload: {
            shared: { file: 'route.js', resourceType: 'script' },
            styles: { file: 'route.css', resourceType: 'style' },
          },
        },
        'pages/example.vue': {
          preload: {
            route: { file: 'route.js', resourceType: 'script' },
          },
        },
      },
    })};\n`
  );
  fs.writeFileSync(
    path.join(repositoryRoot, 'performance-budgets.json'),
    JSON.stringify({
      routes: [
        {
          name: 'Example',
          entries: ['pages/parent.vue', 'pages/example.vue'],
          budgets: { preloadFiles: 2, gzipBytes: 1 },
        },
      ],
    })
  );

  const report = await checkRouteBudgets({ repositoryRoot });

  assert.deepEqual(
    {
      assetDirectoryFound: report.assetsDirectory === assetsDirectory,
      route: report.results[0]?.name,
      preloadFiles: report.results[0]?.metrics.preloadFiles,
      failedMetric: report.results[0]?.failures[0]?.metric,
    },
    {
      assetDirectoryFound: true,
      route: 'Example',
      preloadFiles: 2,
      failedMetric: 'gzipBytes',
    }
  );
});

test('renderReport includes route status and actionable failure details', () => {
  const output = renderReport([
    {
      name: 'Example',
      metrics: {
        preloadFiles: 2,
        jsFiles: 1,
        cssFiles: 1,
        rawBytes: 2000,
        gzipBytes: 1000,
      },
      failures: [{ metric: 'preloadFiles', actual: 2, limit: 1 }],
    },
  ]);

  assert.deepEqual(
    {
      hasFailureStatus: output.includes('| FAIL |'),
      hasFailureDetail: output.includes('files is 2 (budget 1)'),
    },
    { hasFailureStatus: true, hasFailureDetail: true }
  );
});
