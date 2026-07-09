# Playwright: build-based parallel run (prototype + measurements)

## TL;DR

The mocked Playwright suite currently runs against `nuxt dev` with
`workers: 1` / `fullyParallel: false`. Serving a **production build** of the
app instead lets the suite run **fully parallel** with no flakiness, cutting
mocked-suite wall-clock roughly in half end-to-end (and ~4× for test execution
alone).

A prototype config lives at
[`playwright.build.config.ts`](../playwright.build.config.ts).

## Why the dev server forces `workers: 1`

- `nuxt dev` is single-threaded and compiles routes **on demand**. The first
  navigation to each route pays a multi-second compile cost, and concurrent
  requests contend on that single process.
- Running the dev server with multiple workers / `fullyParallel: true` produces
  route-compile races and timeouts (empirically ~4/5 tests failed at 4 workers
  during this investigation).
- So today the suite is serial, and most of each test's time is route
  compilation, not assertions.

## Why a build unlocks parallelism

- The mocked suite never talks to a real backend — every GraphQL call is
  intercepted per-page via `page.route`.
- In mock mode the app is built as a **client-only SPA** (`ssr: !isMockedE2E`
  in `nuxt.config.ts`), so a production build is a static SPA served by Nitro.
- A built Nitro server (`node .output/server/index.mjs`) handles concurrent
  requests cheaply and has **no on-demand compilation**, so many workers can
  run at once without contention.

`VITE_E2E_MOCK_MODE` is consumed at **build time**, so the build must set it:

```bash
NITRO_PRESET=node-server \
VITE_E2E_MOCK_MODE=true \
VITE_GRAPHQL_URL=http://127.0.0.1:4100/graphql \
VITE_SERVER_NAME='Playwright Test Server' \
npx nuxt build

npx playwright test --config playwright.build.config.ts
```

## Measurements (local, 16-core machine, full mocked suite: 56 run / 8 skipped)

| Config | Workers | Wall-clock | Result |
| --- | --- | --- | --- |
| `nuxt dev` (current) | 1 | **344 s (5.7 m)** | 56 passed, 8 skipped |
| production build (prototype) | 8 (`50%`) | **81 s (1.3 m)** test exec | 56 passed, 8 skipped, 0 failed |
| one-time `nuxt build` | — | 87 s | — |

- **Test execution:** 344 s → 81 s ≈ **4.2× faster**.
- **End-to-end including the build:** 344 s → 168 s (87 s build + 81 s tests)
  ≈ **2× faster**, ~3 min saved per run.
- The parallel build run was **stable** (0 flakes), unlike parallel dev runs.

## Additional CI win (independent of the above)

The `playwright-tests` CI job currently starts Neo4j and checks out + installs +
builds the **backend** before running `npm run test:playwright`. But the mocked
suite only starts the backend webServer when `PLAYWRIGHT_STATEFUL === 'true'`,
which CI does **not** set — so the Neo4j + backend steps are unused for the
mocked run. Removing them from the mocked job (or gating them behind the
stateful path) saves several more minutes of CI time on top of the parallel
speedup.

## Recommended CI shape for the mocked job

1. `npm ci --legacy-peer-deps`
2. `npx playwright install --with-deps chromium`
3. `NITRO_PRESET=node-server VITE_E2E_MOCK_MODE=true ... npx nuxt build`
4. `npx playwright test --config playwright.build.config.ts`
5. Drop the Neo4j + backend checkout/install/build steps from the mocked job
   (keep them only for the stateful suite).

## Caveats / follow-ups

- The prototype targets only `tests/playwright/mocked`. The stateful suite still
  needs the dev (or build) server plus the real backend and is out of scope.
- `playwright.build.config.ts` is additive; the existing `playwright.config.ts`
  is unchanged so nothing breaks if CI isn't migrated immediately.
- Worker count is `50%` of cores by default; override with
  `PLAYWRIGHT_WORKERS`. GitHub-hosted runners have fewer cores, so the absolute
  numbers will differ, but the parallel/no-compile advantage holds.
