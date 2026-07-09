# Test Coverage Handoff

Current state:
- Coverage was lifted from about `38.00%` statements to `39.12%` statements by adding real tests for plugin field components and issue moderation composables.
- The new specs live in:
  - `components/plugins/fields/pluginFieldComponents.spec.ts`
  - `composables/useIssueLock.spec.ts`
  - `composables/useIssueBodyEdit.spec.ts`
  - `composables/useIssueActivityFeed.spec.ts`
  - `composables/useIssueCloseReopen.spec.ts`

Goal for the next pass:
- Keep targeting low-friction, high-statement files that can be covered with smoke tests or direct composable tests.
- Prefer tests that execute production code paths, not logic reimplemented inside the spec.
- Favor small, stable components first so statement coverage rises without large fixture or mock overhead.

Best next targets, in order:
1. `components/nav/*`
2. `components/admin/plugins/*`
3. `components/channel/form/*List.vue`
4. `components/discussion/list/*` for the simple list and filter wrappers
5. A small number of route-page smoke tests only after the smaller component batches are in place

Suggested approach for each batch:
- Mount the real Vue component.
- Stub only the boundaries that are external or noisy, such as router, Nuxt link, Apollo, auth, or client-only wrappers.
- Assert the rendered state and one or two key interactions.
- Keep each test focused on one behavior so failures stay easy to read.

What to avoid next:
- Avoid tests that duplicate component logic in the spec file.
- Avoid starting with the largest zero-coverage pages unless the immediate goal is only to move the aggregate percentage.
- Avoid adding tests that are so heavily mocked they no longer exercise the file under test.

Most useful near-term win:
- Add smoke tests for small navigation and admin plugin components, then revisit the medium-sized discussion and channel form components.
