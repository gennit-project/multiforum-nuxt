import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { buildChannel } from '../../helpers/graphqlFixtures';
import { waitForGraphqlOperation } from '../../helpers/mockGraphql';

const channelId = 'cats';

const homePage = {
  __typename: 'WikiPage',
  id: 'wiki-home',
  title: 'Cats knowledge base',
  slug: 'home',
  body: '# Welcome\nPractical knowledge for cat people.',
  editReason: null,
  channelUniqueName: channelId,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-04T00:00:00Z',
  VersionAuthor: {
    __typename: 'User',
    username: 'alice',
    displayName: 'Alice',
    profilePicURL: null,
  },
  PastVersions: [],
  ChildPages: [],
};

const feedingPage = {
  __typename: 'WikiPage',
  id: 'wiki-feeding',
  title: 'Feeding guide',
  slug: 'feeding-guide',
  body: 'How to choose food and establish a feeding routine.',
  channelUniqueName: channelId,
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-01-05T00:00:00Z',
  VersionAuthor: {
    __typename: 'User',
    username: 'bob',
    displayName: 'Bob',
    profilePicURL: null,
  },
};

const groomingPage = {
  __typename: 'WikiPage',
  id: 'wiki-grooming',
  title: 'Grooming basics',
  slug: 'grooming-basics',
  body: 'Brushing, nail trimming, and coat care.',
  channelUniqueName: channelId,
  createdAt: '2026-01-03T00:00:00Z',
  updatedAt: '2026-01-06T00:00:00Z',
  VersionAuthor: {
    __typename: 'User',
    username: 'carol',
    displayName: 'Carol',
    profilePicURL: null,
  },
};

test('channel wiki is a searchable knowledge hub', async ({
  page,
  setupMockedPage,
}) => {
  const baseHandlers = createBaseHandlers({
    channelId,
    channelOverrides: { wikiEnabled: true },
  });
  const pages = [homePage, feedingPage, groomingPage];
  const { diagnostics } = await setupMockedPage({
    handlers: {
      ...baseHandlers,
      getBasicUserInfo: () => {
        const response = baseHandlers.getBasicUserInfo();
        return {
          data: {
            users: response.data.users.map((user) => ({
              ...user,
              AuthoredWikiPageVersionsAggregate: { count: 0 },
            })),
            getUserWikiEditsCount: 0,
          },
        };
      },
      getServerConfig: () => {
        const response = baseHandlers.getServerConfig();
        return {
          data: {
            serverConfigs: response.data.serverConfigs.map((serverConfig) => ({
              ...serverConfig,
              featuredWikiPageIds: [],
              PendingAdminInvites: [],
              PendingModInvites: [],
            })),
          },
        };
      },
      getChannel: () => ({
        data: {
          channels: [
            {
              ...buildChannel({
                uniqueName: channelId,
                displayName: 'Cats',
                overrides: { wikiEnabled: true },
              }),
              isFavorited: false,
              ElevatedChannelRole: null,
              WikiHomePage: homePage,
              PinnedWikiPages: [feedingPage],
            },
          ],
        },
      }),
      getChannelTags: () => ({
        data: { channels: [{ uniqueName: channelId, Tags: [] }] },
      }),
      getTags: () => ({ data: { tags: [] } }),
      getSiteWideWikiList: ({ body }) => {
        const searchInput = String(body.variables?.searchInput || '').toLowerCase();
        const matchingPages = searchInput
          ? pages.filter((wikiPage) =>
              `${wikiPage.title} ${wikiPage.body}`
                .toLowerCase()
                .includes(searchInput)
            )
          : pages;
        return {
          data: {
            getSiteWideWikiList: {
              aggregateWikiPageCount: matchingPages.length,
              featuredWikiPages: [],
              wikiPages: matchingPages,
            },
          },
        };
      },
    },
  });

  await page.goto(`/forums/${channelId}/wiki`);
  await waitForGraphqlOperation(
    diagnostics.completedOperations,
    'getSiteWideWikiList'
  );

  await expect(
    page.getByRole('heading', { name: 'Explore the Cats wiki' })
  ).toBeVisible();
  await expect(page.getByTestId('wiki-introduction')).toContainText(
    'Practical knowledge for cat people.'
  );
  await expect(page.getByTestId('pinned-wiki-pages')).toContainText(
    'Feeding guide'
  );
  await expect(page.getByTestId('channel-wiki-card')).toContainText(
    'Grooming basics'
  );

  await page.getByTestId('channel-wiki-search-input').fill('grooming');

  await expect(page.getByTestId('channel-wiki-card')).toContainText(
    'Grooming basics'
  );
  await expect(page.getByTestId('wiki-introduction')).toHaveCount(0);
  await expect(page.getByTestId('pinned-wiki-pages')).toHaveCount(0);
  expect(diagnostics.pageErrors).toEqual([]);
  expect(diagnostics.consoleErrors).toEqual([]);
});
