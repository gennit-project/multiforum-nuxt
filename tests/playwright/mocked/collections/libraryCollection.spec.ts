import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { expectNoAxeViolations } from '../../helpers/axe';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const COLLECTION_ID = 'collection-1';

const buildCollectionItems = (overrides = {}) => ({
  id: COLLECTION_ID,
  name: 'My Test Collection',
  description: 'A collection owned by the current user.',
  collectionType: 'DISCUSSIONS',
  visibility: 'PRIVATE',
  itemCount: 0,
  itemOrder: [],
  Discussions: [],
  Comments: [],
  Images: [],
  Channels: [],
  Downloads: [],
  ...overrides,
});

const getBaseMocks = (
  username: string,
  collection = buildCollectionItems()
) => ({
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
    data: { serverConfigs: [buildServerConfig({ serverName: 'Listical' })] },
  }),
  // library.vue parent shell counts
  GetAllUserCollections: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getUserFavoriteCounts: () => ({
    data: {
      users: [
        {
          username,
          FavoriteChannelsConnection: { totalCount: 0 },
          FavoriteImagesConnection: { totalCount: 0 },
          FavoriteCommentsConnection: { totalCount: 0 },
          FavoriteDiscussionsConnection: { totalCount: 0 },
          FavoriteDownloadsConnection: { totalCount: 0 },
        },
      ],
    },
  }),
  getUserOwnedDownloadsCount: () => ({
    data: { users: [{ username, OwnedDownloadsAggregate: { count: 0 } }] },
  }),
  getUploadedDownloadableFiles: () => ({
    data: { getUploadedDownloadableFiles: [] },
  }),
  // the collection detail
  GetCollectionItems: () => ({
    data: { collections: [collection] },
  }),
});

test.describe('Library collection detail', () => {
  test('renders an owned collection by name', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(
      page,
      getBaseMocks(TEST_USER)
    );

    try {
      await page.goto(`/library/${COLLECTION_ID}`);

      await expect(page.getByText('My Test Collection').first()).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetCollectionItems'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('reveals accessible item controls only in reorder mode', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    await installGraphqlMocks(
      page,
      getBaseMocks(
        TEST_USER,
        buildCollectionItems({
          itemCount: 2,
          itemOrder: ['discussion-1', 'discussion-2'],
          Discussions: [
            {
              id: 'discussion-1',
              title: 'First saved',
              body: '',
              createdAt: '2026-10-01T00:00:00.000Z',
              hasDownload: false,
              hasSensitiveContent: false,
              isFavorited: false,
              Author: null,
              Tags: [],
              Album: null,
              DiscussionChannels: [],
            },
            {
              id: 'discussion-2',
              title: 'Second saved',
              body: '',
              createdAt: '2026-10-02T00:00:00.000Z',
              hasDownload: false,
              hasSensitiveContent: false,
              isFavorited: false,
              Author: null,
              Tags: [],
              Album: null,
              DiscussionChannels: [],
            },
          ],
        })
      )
    );

    await page.goto(`/library/${COLLECTION_ID}`);

    const moveFirstDown = page.getByRole('button', {
      name: 'Move First saved down',
    });
    await expect(moveFirstDown).toHaveCount(0);
    await page.getByRole('button', { name: 'Reorder', exact: true }).click();
    await expect(moveFirstDown).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('explains private sharing and groups edit actions in the header menu', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    await page.goto(`/library/${COLLECTION_ID}`);

    const shareButton = page.getByTestId('share-collection-button');
    await expect(shareButton).toHaveAttribute('aria-disabled', 'true');
    await shareButton.focus();
    await expect(page.getByRole('tooltip')).toContainText(
      "This collection can't be shared because it is private."
    );

    await page.getByRole('button', { name: 'Collection actions' }).click();
    await expect(
      page.getByRole('menuitem', { name: 'Edit collection' })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Delete collection' })
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
