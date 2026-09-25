# Public Route Performance Budgets

The production build has explicit payload budgets for the public discussions
listing and the discussion/download detail routes. The check reads Nuxt's
generated client manifest, follows each route's static preload closure, and
measures the emitted files instead of relying on source-file estimates. Nested
routes combine every matched Nuxt page entry (for example, the forum wrapper
and its discussion detail child) and deduplicate their shared assets.

Run the check after a production build:

```sh
pnpm run build
pnpm run perf:budget
```

The report includes preload file count, JavaScript and CSS file counts, and
total raw/gzip bytes. CI also stores the complete JSON report as the
`public-route-performance-budgets` artifact.

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

These build budgets protect transfer and module-count regressions. Production
TTFB, LCP, INP, and CLS monitoring remains a separate deployment/observability
workstream.
