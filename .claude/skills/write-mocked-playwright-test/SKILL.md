---
name: write-mocked-playwright-test
description: Write or debug a mocked Playwright E2E test in tests/playwright/mocked. Use whenever adding or editing a *.spec.ts under tests/playwright/mocked, mocking GraphQL for an E2E flow, setting up auth for a browser test, or fixing a flaky mocked Playwright test. No backend/Neo4j required — every GraphQL call is intercepted per page.
---

# Writing a mocked Playwright test (Multiforum)

The mocked suite runs the app as a client-only SPA with every GraphQL call
intercepted per-page. **No backend, no Neo4j.** This is the default E2E suite.

## Run
- All mocked: `pnpm run test:playwright:mocked`
- One file: `pnpm run test:playwright:mocked -- tests/playwright/mocked/discussions/createEditDeleteDiscussions.spec.ts`
- Fast parallel (prebuilt): `pnpm run build:playwright:mocked` once, then
  `pnpm run test:playwright:mocked:build`.

## Skeleton (match the existing suite)
Import from `../../helpers/*`; do not hand-roll auth or fetch mocking.
```typescript
import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

test.describe('Feature', () => {
  test('does the thing', async ({ context, page }, testInfo) => {
    await installMockAuth(context, page, { username: 'alice', email: 'alice@example.com' });

    const diagnostics = await installGraphqlMocks(page, {
      // key each mock by GraphQL operation name; return { data: {...} }
      getBasicUserInfo: () => ({ data: { users: [buildBasicUser({ username: 'alice' })] } }),
      getServerConfig: () => ({ data: { serverConfigs: [buildServerConfig({ enableEvents: true })] } }),
    });

    try {
      await page.goto('/some-route');
      // ... interactions + assertions
    } finally {
      // diagnostics surface unmatched GraphQL ops — check them when a test is flaky
    }
  });
});
```

## Rules
- **Use the helpers**: `installMockAuth()` for auth (never UI login), `installGraphqlMocks()`
  for GraphQL, fixture builders in `helpers/graphqlFixtures.ts` /
  `helpers/moderationFixtures.ts` / `helpers/issueDetailMocks.ts`. Reuse fixtures; extend
  them rather than duplicating inline shapes.
- **Every mocked GraphQL entity needs `__typename`** or Apollo normalization hands the
  component only its key field. This is the #1 cause of "data isn't showing up" flakiness.
- **Wait on requests/UI state, never arbitrary sleeps.** Prefer
  `await page.waitForResponse((r) => r.url().includes('/graphql'))` and role/testid
  locators over `waitForTimeout`.
- **Prefer explicit route helpers / URLs** over hard-coded relative navigation.
- **Report-modal test IDs are content-type specific** (BrokenRulesModal etc.):
  - comment → `report-comment-input`
  - discussion → `report-discussion-input`
  - event → `report-event-input`
  Use the one matching the content being moderated.
- **`diagnostics`** returned by `installGraphqlMocks` reports unmatched operations —
  inspect it first when a test can't find expected data (usually a missing/mis-keyed mock).

## Moderation flows
See [docs/moderation-architecture.md](../../../docs/moderation-architecture.md) for
permission levels and suspension behavior, and `helpers/moderationFixtures.ts` /
`helpers/issueDetailMocks.ts` for ready-made mod fixtures.

Full patterns: [CLAUDE.md](../../../CLAUDE.md) (Playwright Testing) and
[CONTRIBUTING.md](../../../CONTRIBUTING.md#frontend-testing-patterns).
