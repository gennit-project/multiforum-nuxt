// Turn raw browser V8 coverage (from the E2E auto-fixture) into a source-mapped
// lcov + summary. The combined unit+E2E number is produced by uploading this
// lcov AND the unit lcov to Codecov as separate flags (Codecov merges them) —
// MCR can't reliably merge V8+source-maps with Vitest's Istanbul output, so we
// keep the two reports side by side and let Codecov combine.
//
//   node tests/playwright/coverage/report.mjs
//
// Input:  tests/playwright/coverage/.v8/*.json  (raw V8 from the auto-fixture)
// Output: coverage-e2e/ (lcov.info + v8 html + console summary)
import fs from 'node:fs';
import path from 'node:path';
import { CoverageReport } from 'monocart-coverage-reports';

const V8_DIR = path.resolve('tests/playwright/coverage/.v8');
const NUXT_DIR = path.resolve('.output/public/_nuxt');
const CWD = process.cwd();

// App-source scope, matching the unit-coverage include (skip Vue <style>/CSS).
const APP_RE = /(^|\/)(components|pages|composables|utils)\//;
const layerOf = (p) => {
  const m = String(p).match(/(?:^|\/)(components|pages|composables|utils)\//);
  return m ? m[1] : null;
};

const mcr = new CoverageReport({
  name: 'E2E Coverage',
  outputDir: path.resolve('coverage-e2e'),
  reports: [['console-summary'], ['lcovonly'], ['v8']],
  entryFilter: (entry) => !!entry.url && /\/_nuxt\/.*\.js$/.test(entry.url),
  sourceFilter: (sourcePath) =>
    APP_RE.test(sourcePath) &&
    !sourcePath.includes('type=style') &&
    !/\.css(\?|$)/.test(sourcePath),
  // Relative paths so this lcov lines up with the unit lcov for Codecov.
  sourcePath: (p) => p.replace(`${CWD}/`, '').replace(/^\//, ''),
});

// MCR runs in Node and can't fetch the external `.map` files over HTTP, so
// inline each map from disk into the entry source as a data URI.
const inlineSourceMaps = (entries) =>
  entries.map((entry) => {
    if (!entry.source || !entry.url?.includes('/_nuxt/')) return entry;
    const m = entry.source.match(/\/\/# sourceMappingURL=([^\s]+\.js\.map)\s*$/);
    if (!m) return entry;
    const mapFile = path.join(NUXT_DIR, path.basename(m[1]));
    if (!fs.existsSync(mapFile)) return entry;
    const b64 = fs.readFileSync(mapFile).toString('base64');
    return {
      ...entry,
      source: entry.source.replace(
        /\/\/# sourceMappingURL=[^\s]+\.js\.map\s*$/,
        `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${b64}`
      ),
    };
  });

if (!fs.existsSync(V8_DIR)) {
  console.error('No raw V8 coverage in', V8_DIR, '(run with E2E_COVERAGE=true)');
  process.exit(1);
}
const raw = fs.readdirSync(V8_DIR).filter((f) => f.endsWith('.json'));
for (const f of raw) {
  const cov = JSON.parse(fs.readFileSync(path.join(V8_DIR, f), 'utf8'));
  await mcr.add(inlineSourceMaps(cov));
}
console.log(`E2E raw files (one per test): ${raw.length}`);

const result = await mcr.generate();
const appFiles = (result?.files ?? []).filter((f) => APP_RE.test(String(f.sourcePath)));

const layers = { components: { c: 0, t: 0 }, pages: { c: 0, t: 0 }, composables: { c: 0, t: 0 }, utils: { c: 0, t: 0 } };
for (const f of appFiles) {
  const layer = layerOf(f.sourcePath);
  const s = f.summary?.statements;
  if (!layer || !s) continue;
  layers[layer].c += s.covered;
  layers[layer].t += s.total;
}
console.log('\n=== E2E coverage by layer (app source) ===');
let tc = 0;
let tt = 0;
for (const [k, g] of Object.entries(layers)) {
  tc += g.c;
  tt += g.t;
  const pct = g.t ? ((100 * g.c) / g.t).toFixed(1) : '0';
  console.log(`  ${k.padEnd(12)} ${String(pct).padStart(5)}%  ${g.c}/${g.t}`);
}
console.log(`  ${'TOTAL'.padEnd(12)} ${String(tt ? ((100 * tc) / tt).toFixed(1) : 0).padStart(5)}%  ${tc}/${tt}  (${appFiles.length} files)`);
