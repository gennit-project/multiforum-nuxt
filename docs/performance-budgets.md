# Route Performance Budgets

The production build has explicit payload budgets for the public discussions
listing, discussion/download detail, and channel/server/admin issue-detail
routes. The check reads Nuxt's generated client manifest, follows each route's
static preload closure, and measures the emitted files instead of relying on
source-file estimates. Nested routes combine every matched Nuxt page entry
(for example, the forum wrapper and its issue-detail child) and deduplicate
their shared assets.

Run the check after a production build:

```sh
pnpm run build
pnpm run perf:budget
```

The report includes preload file count, JavaScript and CSS file counts, and
total raw/gzip bytes. CI also stores the complete JSON report as the
`route-performance-budgets` artifact.

## Updating a budget

Budgets live in [`performance-budgets.json`](../performance-budgets.json). Each
limit starts roughly five percent above its measured baseline. A budget is a
regression ceiling, not a target: do not raise it merely to make CI pass.

When an intentional product change must increase a limit:

1. run the production build and budget check locally
2. identify the new files in Nuxt's client manifest
3. include the before/after measurements and reason in the pull request
4. update only the affected metric and route

Budgets use gzip level 9 and decimal kilobytes (`1 kB = 1000 bytes`). Dynamic
imports are excluded until they enter a route's static preload closure, so
interaction-only features remain independently downloadable without counting
against first load.

These build budgets protect transfer and module-count regressions. The mocked
issue-detail Playwright coverage separately protects the initial request shape:
the summary precedes client-only activity, related discussion consumers share
one focused request, and the legacy full-discussion query remains deferred
until a moderator actually opens the edit modal. On channel issue-detail routes,
the full forum-shell query is also excluded from SSR and hydrates the optional
sidebar after the primary issue content. CI intentionally does not use a strict
wall-clock page-load limit because shared-runner timing is noisy.

## Diagnosing issue-detail latency

SSR GraphQL requests at or above `NUXT_GRAPHQL_SLOW_REQUEST_MS` emit a sanitized
`[graphql-timing]` JSON log. The default threshold is 500 milliseconds; set it
to `0` temporarily in a local environment to trace every operation. Logs
include only the operation name, frontend request duration, response status,
and the backend's `Server-Timing` header. Request bodies, variables, and tokens
are never logged.

Use several cold and warm requests rather than drawing conclusions from one
sample:

- If `db` is close to backend `total`, profile the generated Cypher and verify
  indexes for that operation.
- If backend `total` is low but frontend duration is high, investigate network
  distance, serverless cold starts, and frontend/backend region placement.
- If the same operation appears repeatedly for one navigation, investigate
  component fan-out, Apollo variables, caching, and request deduplication.
- If GraphQL operations are individually fast but page readiness is slow,
  inspect SSR rendering, static assets, hydration, LCP, and client JavaScript.

Keep the normal production threshold high enough to avoid noisy logs. Lower it
only for a bounded diagnostic session, then restore the default.
