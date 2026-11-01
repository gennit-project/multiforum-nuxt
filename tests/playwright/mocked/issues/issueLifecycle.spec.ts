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
        IssuesConnection: { aggregate: { count: { nodes: 0 } } },
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

for (const scope of ['forum', 'server'] as const) {
  test(`submits a generic ${scope} request with context-owned identity`, async ({ context, page }) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    let submitted: unknown;
    await installGraphqlMocks(page, {
      ...base(),
      getIssueActivity: () => ({ data: { issues: [] } }),
      createIssue: ({ body }) => {
        submitted = body.variables?.input;
        return { data: { createIssue: {
          __typename: 'Issue', id: 'created-request', issueNumber: 42,
          title: 'Generic request', body: 'Please consider this request', isOpen: true,
          flaggedServerRuleViolation: false, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z',
          relatedCommentId: null, relatedDiscussionId: null, relatedEventId: null,
          channelUniqueName: scope === 'forum' ? 'cats' : null,
          Channel: scope === 'forum' ? { __typename: 'Channel', uniqueName: 'cats' } : null,
          Author: { __typename: 'User', username: TEST_USER },
        } } };
      },
    });
    await page.goto(scope === 'forum' ? '/forums/cats/issues/create' : '/server/issues/create', { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder('What do you need help with?').fill('Generic request');
    await page.getByPlaceholder('Explain the request for the moderators').fill('Please consider this request');
    await page.getByRole('button', { name: 'Create Issue', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(scope === 'forum' ? '/forums/cats/issues/42' : '/server/issues/42'));
    await expect.poll(() => submitted).toEqual({
      title: 'Generic request', body: 'Please consider this request', asModerationProfile: false,
      ...(scope === 'forum' ? { channelUniqueName: 'cats' } : {}),
    });
  });
}
