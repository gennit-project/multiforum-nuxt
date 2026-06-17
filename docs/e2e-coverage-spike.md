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

## Run it
```bash
# 1. build with source maps
E2E_COVERAGE=true NITRO_PRESET=node-server VITE_E2E_MOCK_MODE=true \
  VITE_GRAPHQL_URL=http://127.0.0.1:4100/graphql \
  VITE_SERVER_NAME='Playwright Test Server' VITE_SENTRY_AUTH_TOKEN='' \
  npm run build

# 2. collect raw V8 coverage
npx playwright test --config playwright.coverage.config.ts

# 3. produce the source-mapped report (coverage-e2e/lcov.info + console summary)
node tests/playwright/coverage/report.mjs
```

## Productionize (next steps)
This spike collects from a single dedicated spec. To turn it into a real
combined report:

1. **Collect across the whole mocked suite.** Wrap the suite's `test` (in
   `tests/playwright/helpers/testFixture.ts`) with an auto fixture that runs
   `startJSCoverage`/`stopJSCoverage` per test and appends to the raw-V8 dir, so
   every existing E2E test contributes coverage. (No per-spec changes needed.)
2. **Merge with unit coverage.** Monocart can ingest both raw V8 (E2E) and
   Vitest's Istanbul `coverage-final.json` in one `CoverageReport`, producing a
   single merged lcov/HTML and one honest combined percentage.
3. **Wire into CI** behind a flag (the coverage build is slower and emits source
   maps), and upload the merged lcov to Codecov instead of the unit-only one.

[monocart-coverage-reports]: https://github.com/cenfun/monocart-coverage-reports
