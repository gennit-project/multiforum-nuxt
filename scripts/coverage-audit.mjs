#!/usr/bin/env node
/**
 * Coverage audit + test-writing worklist.
 *
 * Refresh coverage first, then run this:
 *   npm run coverage
 *   node scripts/coverage-audit.mjs
 *
 * It reads coverage/lcov.info plus the component/spec layout on disk and prints:
 *   1. Buckets       — where uncovered component lines actually live
 *      (recoverable-behind-a-spec vs net-new work).
 *   2. Recoverable   — components that HAVE a spec but still sit <25% covered
 *      (usually a spec that never mounts the real component).
 *   3. Worklist      — the highest-value net-new targets: components with no
 *      related spec, ranked by uncovered lines, annotated with a rough
 *      difficulty signal, and with heavy third-party-lib wrappers split out
 *      (extract their logic into utils instead of mounting them).
 *
 * Flags: --all shows the full worklist instead of the top 25.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';

const ROOT = process.cwd();
const LOW = 25; // line-% threshold below which a file is "barely covered"
const TOP = process.argv.includes('--all') ? Infinity : 25;

if (!existsSync('coverage/lcov.info')) {
  console.error('coverage/lcov.info not found. Run `npm run coverage` first.');
  process.exit(1);
}

// --- gather component .vue files and spec basenames -------------------------
const walk = (dir, test, out = []) => {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e.startsWith('.')) continue;
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p, test, out) : test(e) && out.push(p);
  }
  return out;
};
const components = walk(join(ROOT, 'components'), (e) => e.endsWith('.vue')).map(
  (p) => p.replace(ROOT + '/', '')
);
const specBasenames = new Set(
  walk(ROOT, (e) => /\.(spec|test)\.ts$/.test(e)).map((p) => basename(p))
);
const hasRelatedSpec = (comp) => {
  const n = basename(comp, '.vue');
  for (const b of specBasenames) {
    if (b === `${n}.spec.ts` || b === `${n}.test.ts` || b.startsWith(`${n}.`)) return true;
  }
  return false;
};

// --- per-file coverage from lcov --------------------------------------------
const cov = {};
for (const rec of readFileSync('coverage/lcov.info', 'utf8').split('end_of_record')) {
  const m = rec.match(/SF:(.*)/);
  if (!m) continue;
  const lf = +(rec.match(/LF:(\d+)/) || [])[1] || 0;
  const lh = +(rec.match(/LH:(\d+)/) || [])[1] || 0;
  if (lf) cov[m[1].trim()] = { pct: Math.round((lh / lf) * 100), unc: lf - lh };
}

// --- testability signals from component source ------------------------------
const HEAVY = [
  ["three", 'three.js / WebGL'],
  ['@google/model-viewer', '3D model-viewer'],
  ['js-api-loader', 'Google Maps'],
  ['@googlemaps', 'Google Maps'],
  ['google.maps', 'Google Maps'],
  ['lightgallery', 'lightgallery'],
  ['chart.js', 'Chart.js canvas'],
  ['vue-chartjs', 'Chart.js canvas'],
  ['vuemoji-picker', 'emoji picker'],
  ['monaco', 'Monaco editor'],
  ['codemirror', 'CodeMirror'],
  ['md-editor-v3', 'md-editor-v3'],
];
const signals = (comp) => {
  const src = readFileSync(join(ROOT, comp), 'utf8');
  const heavy = HEAVY.find(([pat]) => src.includes(pat));
  let difficulty = 'pure-ish';
  if (/useQuery|useMutation|@vue\/apollo-composable/.test(src)) difficulty = 'needs-apollo-mock';
  else if (/useDisplay|from 'vuetify'/.test(src)) difficulty = 'needs-vuetify-stub';
  return { heavy: heavy ? heavy[1] : null, difficulty };
};

// --- buckets ----------------------------------------------------------------
const buckets = { specLow: [0, 0], specOk: [0, 0], noSpecLow: [0, 0], noSpecOk: [0, 0] };
for (const c of components) {
  const cc = cov[c] || { pct: 0, unc: 0 };
  const key = (hasRelatedSpec(c) ? 'spec' : 'noSpec') + (cc.pct < LOW ? 'Low' : 'Ok');
  buckets[key][0]++;
  buckets[key][1] += cc.unc;
}
const fmt = (n) => String(n).padStart(5);
console.log('=== Where uncovered component lines live ===');
console.log('bucket                               | files | uncovered');
console.log(`has spec  & <${LOW}% cov (RECOVERABLE)  | ${fmt(buckets.specLow[0])} | ${buckets.specLow[1]}`);
console.log(`has spec  & >=${LOW}% cov              | ${fmt(buckets.specOk[0])} | ${buckets.specOk[1]}`);
console.log(`NO spec   & <${LOW}% cov (NET-NEW)     | ${fmt(buckets.noSpecLow[0])} | ${buckets.noSpecLow[1]}`);
console.log(`NO spec   & >=${LOW}% cov              | ${fmt(buckets.noSpecOk[0])} | ${buckets.noSpecOk[1]}`);

// --- recoverable: have a spec but still barely covered ----------------------
const recoverable = components
  .filter((c) => hasRelatedSpec(c) && (cov[c]?.pct ?? 0) < LOW)
  .sort((a, b) => (cov[b]?.unc ?? 0) - (cov[a]?.unc ?? 0));
console.log(`\n=== Recoverable (spec exists but <${LOW}% — fix the spec) ===`);
if (!recoverable.length) console.log('(none)');
for (const c of recoverable) console.log(`${String(cov[c].pct).padStart(3)}% | ${String(cov[c].unc).padStart(4)} unc | ${c}`);

// --- worklist: net-new targets ----------------------------------------------
const candidates = components
  .filter((c) => !hasRelatedSpec(c) && (cov[c]?.pct ?? 0) < LOW && (cov[c]?.unc ?? 0) > 0)
  .map((c) => ({ comp: c, ...cov[c], ...signals(c) }))
  .sort((a, b) => b.unc - a.unc);

const mountable = candidates.filter((c) => !c.heavy);
const heavyOnes = candidates.filter((c) => c.heavy);

console.log(`\n=== WORKLIST: net-new mountable components (top ${TOP === Infinity ? 'all' : TOP} by uncovered) ===`);
console.log('uncov | difficulty         | component');
for (const c of mountable.slice(0, TOP)) {
  console.log(`${String(c.unc).padStart(5)} | ${c.difficulty.padEnd(18)} | ${c.comp}`);
}

console.log(`\n=== Heavy 3rd-party wrappers (extract logic into utils; do NOT mount) ===`);
for (const c of heavyOnes.slice(0, 15)) {
  console.log(`${String(c.unc).padStart(5)} | ${c.heavy.padEnd(18)} | ${c.comp}`);
}
