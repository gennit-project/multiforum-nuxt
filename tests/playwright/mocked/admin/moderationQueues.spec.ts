import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Admin (server-scoped) moderation queues: the server issues lists and the
// image-reports queue. These admin pages had no E2E coverage.
const TEST_USER = 'alice';

test.describe('Admin moderation queues', () => {
  test('server issues index renders the issues list', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      getIssues: () => ({ data: { issues: [], issuesAggregate: { count: 0 } } }),
    });

    try {
      await page.goto('/admin/issues', { waitUntil: 'domcontentloaded' });
      await expect(page.getByPlaceholder('Search issues')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('closed server issues renders the closed-issues list', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      getIssues: () => ({ data: { issues: [], issuesAggregate: { count: 0 } } }),
    });

    try {
      await page.goto('/admin/issues/closed', { waitUntil: 'domcontentloaded' });
      await expect(page.getByPlaceholder('Search closed issues')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('image-reports queue renders the report-type tabs', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
    });

    try {
      await page.goto('/admin/image-reports', { waitUntil: 'domcontentloaded' });
      // "Album Image" appears both as a tab and in a description list item, so
      // match the exact tab label.
      await expect(
        page.getByText('Album Image', { exact: true }).first()
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
