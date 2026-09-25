import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

const BUILD_CANDIDATES = [
  {
    manifest:
      '.vercel/output/functions/__fallback.func/chunks/build/client.precomputed.mjs',
    assets: '.vercel/output/static/_nuxt',
  },
  {
    manifest: '.output/server/chunks/build/client.precomputed.mjs',
    assets: '.output/public/_nuxt',
  },
];

const METRIC_LABELS = {
  preloadFiles: 'files',
  rawBytes: 'raw',
  gzipBytes: 'gzip',
  jsGzipBytes: 'JS gzip',
  cssGzipBytes: 'CSS gzip',
};

export const formatBytes = (bytes) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
    style: 'unit',
    unit: 'kilobyte',
    unitDisplay: 'narrow',
  }).format(bytes / 1000);

export const findBuildArtifacts = (repositoryRoot) => {
  for (const candidate of BUILD_CANDIDATES) {
    const manifestPath = path.join(repositoryRoot, candidate.manifest);
    const assetsDirectory = path.join(repositoryRoot, candidate.assets);
    if (fs.existsSync(manifestPath) && fs.existsSync(assetsDirectory)) {
      return { manifestPath, assetsDirectory };
    }
  }

  throw new Error(
    'No Nuxt production build found. Run `pnpm run build` before checking route budgets.'
  );
};

export const collectRouteMetrics = ({ dependency, assetsDirectory }) => {
  if (!dependency?.preload) {
    throw new Error(
      'The route has no preload data in the Nuxt client manifest.'
    );
  }

  const resourcesByFile = new Map();
  for (const resource of Object.values(dependency.preload)) {
    if (resource?.file) resourcesByFile.set(resource.file, resource);
  }

  const metrics = {
    preloadFiles: resourcesByFile.size,
    jsFiles: 0,
    cssFiles: 0,
    rawBytes: 0,
    gzipBytes: 0,
    jsGzipBytes: 0,
    cssGzipBytes: 0,
  };

  for (const [file, resource] of resourcesByFile) {
    const assetPath = path.join(assetsDirectory, file);
    if (!fs.existsSync(assetPath)) {
      throw new Error(`Preloaded asset is missing: ${assetPath}`);
    }

    const contents = fs.readFileSync(assetPath);
    const gzipBytes = gzipSync(contents, { level: 9 }).length;
    metrics.rawBytes += contents.length;
    metrics.gzipBytes += gzipBytes;

    if (resource.resourceType === 'style' || file.endsWith('.css')) {
      metrics.cssFiles += 1;
      metrics.cssGzipBytes += gzipBytes;
    } else if (resource.resourceType === 'script' || file.endsWith('.js')) {
      metrics.jsFiles += 1;
      metrics.jsGzipBytes += gzipBytes;
    }
  }

  return metrics;
};

export const evaluateBudgets = (metrics, budgets) =>
  Object.entries(budgets).flatMap(([metric, limit]) => {
    const actual = metrics[metric];
    if (!Number.isFinite(actual)) {
      throw new Error(`Unknown route-budget metric: ${metric}`);
    }
    if (!Number.isFinite(limit) || limit < 0) {
      throw new Error(`Invalid limit for route-budget metric: ${metric}`);
    }
    return actual > limit ? [{ metric, actual, limit }] : [];
  });

const displayMetric = (metric, value) =>
  metric === 'preloadFiles' ? String(value) : formatBytes(value);

export const renderReport = (results) => {
  const lines = [
    '| Route | Files | JS | CSS | Raw | Gzip | Status |',
    '| --- | ---: | ---: | ---: | ---: | ---: | :---: |',
  ];

  for (const result of results) {
    const { metrics } = result;
    lines.push(
      `| ${result.name} | ${metrics.preloadFiles} | ${metrics.jsFiles} | ${metrics.cssFiles} | ${formatBytes(metrics.rawBytes)} | ${formatBytes(metrics.gzipBytes)} | ${result.failures.length ? 'FAIL' : 'PASS'} |`
    );
  }

  const failures = results.flatMap((result) =>
    result.failures.map(
      ({ metric, actual, limit }) =>
        `${result.name}: ${METRIC_LABELS[metric] || metric} is ${displayMetric(metric, actual)} (budget ${displayMetric(metric, limit)})`
    )
  );

  if (failures.length) {
    lines.push(
      '',
      'Budget failures:',
      ...failures.map((failure) => `- ${failure}`)
    );
  }

  return lines.join('\n');
};

const parseJsonOutput = (args) => {
  const index = args.indexOf('--json');
  if (index === -1) return null;
  const outputPath = args[index + 1];
  if (!outputPath || outputPath.startsWith('--')) {
    throw new Error('`--json` requires an output path.');
  }
  return outputPath;
};

export const checkRouteBudgets = async ({
  repositoryRoot = process.cwd(),
  configPath = path.join(repositoryRoot, 'performance-budgets.json'),
} = {}) => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    throw new Error('performance-budgets.json must define at least one route.');
  }

  const { manifestPath, assetsDirectory } = findBuildArtifacts(repositoryRoot);
  const manifestUrl = `${pathToFileURL(manifestPath).href}?budget=${Date.now()}`;
  const { default: manifest } = await import(manifestUrl);

  const results = config.routes.map((route) => {
    if (!Array.isArray(route.entries) || route.entries.length === 0) {
      throw new Error(`${route.name} must define at least one route entry.`);
    }

    const combinedPreload = {};
    for (const entry of route.entries) {
      const dependency = manifest.dependencies?.[entry];
      if (!dependency) {
        throw new Error(
          `Route is missing from the Nuxt client manifest: ${entry}`
        );
      }
      for (const [key, resource] of Object.entries(dependency.preload || {})) {
        combinedPreload[`${entry}:${key}`] = resource;
      }
    }

    const dependency = { preload: combinedPreload };
    const metrics = collectRouteMetrics({ dependency, assetsDirectory });
    return {
      name: route.name,
      entries: route.entries,
      budgets: route.budgets,
      metrics,
      failures: evaluateBudgets(metrics, route.budgets),
    };
  });

  return { manifestPath, assetsDirectory, results };
};

const run = async () => {
  try {
    const report = await checkRouteBudgets();
    const output = renderReport(report.results);
    console.log(output);

    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Public route performance budgets\n\n${output}\n`
      );
    }

    const jsonOutput = parseJsonOutput(process.argv.slice(2));
    if (jsonOutput) {
      const resolvedOutput = path.resolve(jsonOutput);
      fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
      fs.writeFileSync(resolvedOutput, `${JSON.stringify(report, null, 2)}\n`);
    }

    if (report.results.some((result) => result.failures.length > 0)) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await run();
}
