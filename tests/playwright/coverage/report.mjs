// SPIKE: turn raw browser V8 coverage into a source-mapped report via MCR.
// Usage: node tests/playwright/coverage/report.mjs
import fs from 'node:fs';
import path from 'node:path';
import { CoverageReport } from 'monocart-coverage-reports';

const V8_DIR = path.resolve('tests/playwright/coverage/.v8');

const APP_RE = /^(components|pages|composables|utils)\//;

const mcr = new CoverageReport({
  name: 'E2E Coverage Spike',
  outputDir: path.resolve('coverage-e2e'),
  reports: [['console-summary'], ['lcovonly'], ['v8']],
  // Only process the app's own bundles, not vendor chunks.
  entryFilter: (entry) => !!entry.url && entry.url.includes('/_nuxt/'),
  // Match the unit-coverage scope (components/pages/composables/utils).
  sourceFilter: (sourcePath) => APP_RE.test(sourcePath),
});

const NUXT_DIR = path.resolve('.output/public/_nuxt');

// MCR runs in node and can't fetch the external `.map` files over HTTP, so
// inline each map from disk into the entry's source as a data URI.
const inlineSourceMaps = (entries) =>
  entries.map((entry) => {
    if (!entry.source || !entry.url?.includes('/_nuxt/')) return entry;
    const m = entry.source.match(/\/\/# sourceMappingURL=([^\s]+\.js\.map)\s*$/);
    if (!m) return entry;
    const mapFile = path.join(NUXT_DIR, path.basename(m[1]));
    if (!fs.existsSync(mapFile)) return entry;
    const b64 = fs.readFileSync(mapFile).toString('base64');
    const source = entry.source.replace(
      /\/\/# sourceMappingURL=[^\s]+\.js\.map\s*$/,
      `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${b64}`
    );
    return { ...entry, source };
  });

const files = fs
  .readdirSync(V8_DIR)
  .filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.error('No raw V8 coverage found in', V8_DIR);
  process.exit(1);
}

let inlined = 0;
for (const f of files) {
  const cov = JSON.parse(fs.readFileSync(path.join(V8_DIR, f), 'utf8'));
  const withMaps = inlineSourceMaps(cov);
  inlined += withMaps.filter((e) => e.source?.includes('base64,')).length;
  await mcr.add(withMaps);
}
console.log('entries with inlined source maps:', inlined);

const result = await mcr.generate();
const appFiles = (result?.files ?? []).filter((f) => APP_RE.test(String(f.sourcePath)));

const layers = { components: {}, pages: {}, composables: {}, utils: {} };
for (const k of Object.keys(layers)) layers[k] = { c: 0, t: 0, files: 0 };
for (const f of appFiles) {
  const layer = String(f.sourcePath).split('/')[0];
  const s = f.summary?.statements;
  if (!layers[layer] || !s) continue;
  layers[layer].c += s.covered;
  layers[layer].t += s.total;
  layers[layer].files += 1;
}
console.log('\n=== E2E coverage by layer (app source) ===');
let tc = 0;
let tt = 0;
for (const [k, g] of Object.entries(layers)) {
  tc += g.c;
  tt += g.t;
  const pct = g.t ? ((100 * g.c) / g.t).toFixed(1) : '0';
  console.log(`  ${k.padEnd(12)} ${String(pct).padStart(5)}%  ${g.c}/${g.t}  (${g.files} files)`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(tt ? ((100 * tc) / tt).toFixed(1) : 0).padStart(5)}%  ${tc}/${tt}  (${appFiles.length} files)`);
