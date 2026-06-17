# Spike: merging E2E (Playwright) coverage with unit coverage

## Why
Unit coverage sits at ~35%, dragged down almost entirely by `pages/` (~5%) and
template-heavy components — code that is structurally hard to unit-test but is
exercised end-to-end by the Playwright suite. None of that E2E confidence shows
up in the coverage number. This spike proves we can capture browser coverage,
map it back to source, and report it alongside unit coverage.

## Result: it works
Collecting V8 coverage while visiting **just three pages** (`/library`,
`/account_settings`, `/u/cluse/comments`) and mapping it back to source:

```
=== E2E coverage by layer (app source) ===
  components    11.0%  888/8051   (291 files)
  pages         19.3%  129/669    (34 files)
  composables   15.6%  244/1567   (41 files)
  utils         13.2%  120/908    (31 files)
  TOTAL         12.3%  1381/11195 (397 files)
```

The headline: **`pages/` lit up to ~19% from three page visits**, versus ~5%
under unit testing. The full mocked suite (64 tests across many pages and
flows) would push the page/component layers far higher. (Statement counts here
use Monocart's accounting, which differs from Vitest's V8 denominator, so the
percentages aren't directly additive to the unit number — see "Productionize".)

## How it works
1. Build the mock-mode SPA **with client source maps** (`E2E_COVERAGE=true`
   sets `sourcemap.client` in `nuxt.config.ts`).
2. A Playwright spec calls `page.coverage.startJSCoverage()` / `stopJSCoverage()`
   around page visits and writes the raw V8 entries to disk.
3. `tests/playwright/coverage/report.mjs` feeds them to
   [monocart-coverage-reports]. Because the report runs in Node (and can't fetch
   the external `.map` files over HTTP), it **inlines each `.map` from
   `.output/public/_nuxt` into the entry's source as a data URI** before mapping
   — this was the one non-obvious step that made source mapping work.

## Productionized

The three steps from the original spike are now implemented:

**1. Collect across the whole mocked suite — done.** The suite's shared `test`
(`tests/playwright/helpers/testFixture.ts`) now has an auto `page` fixture that
runs `startJSCoverage`/`stopJSCoverage` per test when `E2E_COVERAGE=true` (inert
otherwise) and writes raw V8 per test. The 20 specs that imported `test` from
`@playwright/test` were migrated to import it from `testFixture`, so **every**
mocked spec contributes — no per-test code. Validated: a 12-test slice
(channel/library/comment/profile specs) maps to:

```
=== E2E coverage by layer (app source) ===
  components    25.4%  2860/11267
  pages         55.0%  387/704      <- vs ~5% from unit tests
  composables   32.2%  1209/3752
  utils         23.2%  686/2951
  TOTAL         27.5%  5142/18674   (622 files)
```

The full 64-test suite covers more still.

**2. Merge with unit coverage — via Codecov flags.** Monocart's converter
*cannot* reliably merge V8+source-maps with Vitest's Istanbul output (it throws
in its CSS-AST path on Vue SFC sources). Rather than fight it, the two reports
stay side by side and **Codecov merges them**: the unit lcov is uploaded with
flag `unit` and the E2E lcov (`coverage-e2e/lcov.info`) with flag `e2e`; the
combined number is computed on Codecov. Both lcovs use repo-relative paths so
the same file lines up across them.

**3. CI — opt-in.** `.github/workflows/e2e-coverage.yml`
(`workflow_dispatch`/optional schedule) runs unit + E2E coverage and uploads
both flags. It's not on the per-PR path because the source-map build is slower.

## Run it locally
```bash
npm run coverage              # unit -> coverage/lcov.info
npm run coverage:e2e:build    # sourcemap build (mock mode)
npm run coverage:e2e:collect  # run mocked suite with E2E_COVERAGE=true
npm run coverage:e2e:report   # source-mapped E2E report -> coverage-e2e/lcov.info
```

## Known limitation
The Monocart V8↔Istanbul merge bug (above) is why we merge at the Codecov layer
instead of producing one local combined lcov. If a single local artifact is
needed later, an lcov-level merge (e.g. `lcov-result-merger`) over the two
repo-relative lcovs is the fallback.

[monocart-coverage-reports]: https://github.com/cenfun/monocart-coverage-reports
