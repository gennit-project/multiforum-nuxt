import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Forum issue lifecycle pages — creation + the open/closed queues. Issue DETAIL
// is already covered (mod/issueDetail.spec); these cover the create form and the
// list views, which had no E2E.
const TEST_USER = 'alice';
const TEST_CHANNEL = 'cats';

const base = () =>
  createBaseHandlers({ username: TEST_USER, channelId: TEST_CHANNEL });

const issuesRow = () => ({
  data: {
    channels: [
      {
        __typename: 'Channel',
        uniqueName: TEST_CHANNEL,
        Issues: [],
        IssuesAggregate: { count: 0 },
      },
    ],
  },
});

// The forum open/closed list pages render via getSiteWideIssueList scoped to
// the channel.
const siteWideIssues = () => ({
  data: {
    getSiteWideIssueList: {
      __typename: 'SiteWideIssueListFormat',
      aggregateIssueCount: 0,
      issues: [],
    },
  },
});

test.describe('Forum issue lifecycle', () => {
  test('issue create page renders the create-issue form', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getIssuesByChannel: issuesRow,
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues/create`, { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByPlaceholder('What do you need help with?')
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('issues index renders the open-issues list', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getSiteWideIssueList: siteWideIssues,
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByPlaceholder('Search issues')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('closed issues page renders the closed-issues list', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getSiteWideIssueList: siteWideIssues,
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues/closed`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByPlaceholder('Search closed issues')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
