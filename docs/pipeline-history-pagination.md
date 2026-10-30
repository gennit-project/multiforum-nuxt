# Bounded pipeline history

Deploy the backend change for [multiforum-backend#359](https://github.com/gennit-project/multiforum-backend/issues/359) before this frontend. The frontend requires `getPipelineSummaryPage` and `getPipelineRunPage`; it does not silently fall back to the unbounded history endpoint. The companion backend preserves its old APIs, so backend-first rollout remains compatible with older frontend instances. Neither PR performs a deployment.

The generated schema was rebuilt from the companion backend's in-process Neo4j GraphQL introspection (no database or production endpoint). Contract source: `e1c06f20aba819bced36ee7de03cebc8e24dddfb`; verified unchanged in final backend `ada51e29762bc13dab27e4bbf728779f6593605c`. The three frontend pipeline operations were validated against that schema.

- Summary requests return at most 10 attempts (one for the compact latest-pipeline widgets) and 20 stages per attempt. The checks page applies its event filter before pagination; channel requests also send the exact channel filter.
- Status comes from `displayStatus`, and polling comes from target-wide `hasActiveWork`, including work outside the loaded history. Historical `hasFailedWork` is not interpreted as the latest attempt's status.
- Separate, filtered first-attempt queries preserve applicable-check status and retry eligibility even when unrelated events fill the history page.
- History and stage continuation use opaque cursors, deduplicate IDs, retain existing content on continuation errors, and reset when targets or filters change. Explicit refresh starts history over; automatic polling refreshes the first page while retaining expanded history/stages. Visible older active attempts also refresh their detail status.
- New attempt links use the attempt's database `id` for detail lookup and retain `pipelineId` for the scroll anchor. Legacy bookmarks continue to pass pipelineId to the detail endpoint, which resolves exact IDs first and then unique pipeline IDs. The frontend accepts either identifier only when the returned target, type, scope, channel, and event belong to the current view. Ambiguous legacy identifiers fail closed.
- “Copy diagnostics” copies the currently loaded stages. Load additional stages before copying their diagnostics.

Local verification uses mocked GraphQL and local auth fixtures, not production services. The browser regression covers omitted failed stages, target-wide active work, stage continuation, a failed history-page retry, an older permalink, and axe accessibility checks. The runtime's bundled Chromium was used because the Playwright browser-download host is excluded by its network policy.
