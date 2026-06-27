import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const SLUG = 'cat-care';
const WIKI_PAGE_ID = 'wiki-page-1';

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: { users: [buildBasicUser({ username, displayName: username })] },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserFavorites: () => ({
    data: { users: [{ username, FavoriteChannels: [], Collections: [] }] },
  }),
  GetUserFavoriteChannels: () => ({
    data: { users: [{ username, FavoriteChannels: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({ serverName: 'Listical', enableEvents: true }),
      ],
    },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          overrides: { eventsEnabled: true, wikiEnabled: true },
        }),
      ],
    },
  }),
  getChannelTags: () => ({
    data: { channels: [{ uniqueName: TEST_CHANNEL, Tags: [] }] },
  }),
  getTags: () => ({ data: { tags: [] } }),
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
});

// A wiki page whose current body differs from every past version, with two
// past versions sorted newest-first (as the GraphQL query returns them).
const buildWikiPage = (overrides = {}) => ({
  __typename: 'WikiPage',
  id: WIKI_PAGE_ID,
  title: 'Cat Care Guide',
  slug: SLUG,
  body: 'Current version of the page.',
  editReason: 'Latest tweak',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  VersionAuthor: { username: 'carol' },
  ChildPages: [],
  PastVersions: [
    {
      id: 'rev-2',
      body: 'Second version of the page.',
      editReason: 'Clarified wording',
      createdAt: '2024-01-10T00:00:00Z',
      Author: { username: 'bob' },
    },
    {
      id: 'rev-1',
      body: 'Original version of the page.',
      editReason: null,
      createdAt: '2024-01-05T00:00:00Z',
      Author: { username: 'alice' },
    },
  ],
  Channel: { uniqueName: TEST_CHANNEL },
  ...overrides,
});

test.describe('Wiki revision history pages', () => {
  test('lists revisions newest-first and shows edit reasons', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getWikiPage: () => ({ data: { wikiPages: [buildWikiPage()] } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/wiki/revisions/${SLUG}`);
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'getWikiPage'
      );

      await expect(
        page.getByRole('heading', { name: 'Revision History For Wiki Page' })
      ).toBeVisible();
      await expect(page.getByText('has been edited 2 times')).toBeVisible();

      // Revisions are listed newest-first: the current/most-recent edit (by the
      // version author) on top, then the older edit.
      const authors = page.locator('div.font-medium.text-gray-900');
      await expect(authors.nth(0)).toHaveText('carol');
      await expect(authors.nth(1)).toHaveText('alice');
      await expect(
        page.getByText('Most recent edit', { exact: true })
      ).toBeVisible();

      // Edit reasons surface in the list.
      await expect(page.getByText('Clarified wording')).toBeVisible();
      await expect(page.getByText('Latest tweak')).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('opens a revision detail page rendered through the shared diff', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getWikiPage: () => ({ data: { wikiPages: [buildWikiPage()] } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/wiki/revisions/${SLUG}`);
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'getWikiPage'
      );

      // Click the top (most-recent) revision to open its detail page. Clicking
      // the badge bubbles to the row's click handler.
      await page.getByText('Most recent edit', { exact: true }).click();
      await expect(page).toHaveURL(
        new RegExp(`/wiki/revisions/diff/${SLUG}/most-recent-edit$`)
      );

      // Breadcrumbs + heading.
      const breadcrumb = page.locator(
        'nav[aria-label="Wiki revision detail breadcrumb"]'
      );
      await expect(breadcrumb).toContainText('Cat Care Guide');
      await expect(breadcrumb).toContainText('Revision History');
      await expect(breadcrumb).toContainText('Revision Detail');
      await expect(
        page.getByRole('heading', { name: 'Revision Detail' })
      ).toBeVisible();
      await expect(
        page.getByText('Most recent edit', { exact: true })
      ).toBeVisible();

      // Rendered through the shared RevisionDiffContent: side-by-side panes,
      // from/to metadata, the diffed content, and the legend.
      await expect(
        page.getByRole('heading', { name: 'Previous Version', exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Current Version', exact: true })
      ).toBeVisible();
      await expect(page.getByText('From version by bob')).toBeVisible();
      await expect(page.getByText('To version by carol')).toBeVisible();
      await expect(
        page.getByText('Second version of the page.', { exact: true })
      ).toBeVisible();
      await expect(
        page.getByText('Current version of the page.', { exact: true })
      ).toBeVisible();
      await expect(page.getByText('Removed content')).toBeVisible();
      await expect(page.getByText('Added content')).toBeVisible();

      // The old v-code-diff view-mode toggle is gone.
      await expect(page.locator('.v-code-diff')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: /split|unified|line by line|side by side/i })
      ).toHaveCount(0);

      // The redact action is present (foundation work leaves delete intact).
      await expect(
        page.getByRole('button', { name: 'Redact Revision' })
      ).toBeVisible();

      // The compare-revision dropdown ordering matches the list ordering
      // (most-recent first, then the older edit).
      const optionLabels = await page
        .locator('#wiki-revision-select option')
        .allTextContents();
      expect(optionLabels).toHaveLength(2);
      expect(optionLabels[0]).toContain('Most recent edit by carol');
      expect(optionLabels[1]).toContain('Edit by alice');

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('redacting a revision routes back to the revision list', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getWikiPage: () => ({ data: { wikiPages: [buildWikiPage()] } }),
      deleteWikiRevision: () => ({
        data: {
          deleteWikiRevision: {
            id: 'rev-2',
            body: 'Second version of the page.',
            editReason: 'Clarified wording',
            createdAt: '2024-01-10T00:00:00Z',
            updatedAt: '2024-01-10T00:00:00Z',
            Author: { username: 'bob' },
          },
        },
      }),
    });

    // The redact button asks for confirmation via window.confirm.
    page.on('dialog', (dialog) => dialog.accept());

    try {
      await page.goto(
        `/forums/${TEST_CHANNEL}/wiki/revisions/diff/${SLUG}/most-recent-edit`
      );
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'getWikiPage'
      );

      await page.getByRole('button', { name: 'Redact Revision' }).click();
      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'deleteWikiRevision'
      );

      // onDone navigates back to the revision history list.
      await expect(page).toHaveURL(
        new RegExp(`/wiki/revisions/${SLUG}$`)
      );
      await expect(
        page.getByRole('heading', { name: 'Revision History For Wiki Page' })
      ).toBeVisible();

      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
