import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { waitForGraphqlOperation } from '../../helpers/mockGraphql';

const channelId = 'cats';
const wikiPageId = 'wiki-feeding';

const feedingPage = {
  __typename: 'WikiPage',
  id: wikiPageId,
  title: 'Feeding guide',
  slug: 'feeding-guide',
  body: 'How to choose food and establish a feeding routine.',
  locked: false,
  channelUniqueName: channelId,
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-01-05T00:00:00Z',
  VersionAuthor: {
    __typename: 'User',
    username: 'bob',
    displayName: 'Bob',
    profilePicURL: null,
  },
  PastVersions: [],
  ChildPages: [],
};

const buildHandlers = ({ serverAdmins }: { serverAdmins: string[] }) => {
  const baseHandlers = createBaseHandlers({
    channelId,
    channelOverrides: { wikiEnabled: true },
  });
  let featuredWikiPageIds: string[] = [];
  const savedLists: string[][] = [];

  const handlers = {
    ...baseHandlers,
    getServerConfig: () => {
      const response = baseHandlers.getServerConfig();
      return {
        data: {
          serverConfigs: response.data.serverConfigs.map((serverConfig) => ({
            ...serverConfig,
            featuredWikiPageIds,
            Admins: serverAdmins.map((username) => ({
              __typename: 'User',
              username,
            })),
            PendingAdminInvites: [],
            PendingModInvites: [],
          })),
        },
      };
    },
    getWikiPage: () => ({ data: { wikiPages: [feedingPage] } }),
    setFeaturedWikiPages: ({
      body,
    }: {
      body: { variables?: { wikiPageIds?: string[] } };
    }) => {
      featuredWikiPageIds = body.variables?.wikiPageIds ?? [];
      savedLists.push(featuredWikiPageIds);
      return {
        data: {
          setFeaturedWikiPages: {
            __typename: 'ServerConfig',
            serverName:
              baseHandlers.getServerConfig().data.serverConfigs[0]?.serverName,
            featuredWikiPageIds,
          },
        },
      };
    },
  };

  return { handlers, savedLists };
};

test.describe('Feature a wiki page', () => {
  test('server admin can feature and unfeature a wiki page', async ({
    page,
    setupMockedPage,
  }) => {
    const { handlers, savedLists } = buildHandlers({ serverAdmins: ['cluse'] });
    const { diagnostics } = await setupMockedPage({ handlers });

    await page.goto(`/forums/${channelId}/wiki/feeding-guide`);
    await waitForGraphqlOperation(
      diagnostics.completedOperations,
      'getWikiPage'
    );

    const button = page.getByTestId('wiki-page-feature-button');
    await expect(button).toHaveText('Feature on site wiki');

    await button.click();
    await expect(button).toHaveText('Remove from featured');

    await button.click();
    await expect(button).toHaveText('Feature on site wiki');

    expect(savedLists).toEqual([[wikiPageId], []]);
  });

  test('non-admin users do not see the feature button', async ({
    page,
    setupMockedPage,
  }) => {
    const { handlers } = buildHandlers({ serverAdmins: ['someone-else'] });
    const { diagnostics } = await setupMockedPage({ handlers });

    await page.goto(`/forums/${channelId}/wiki/feeding-guide`);
    await waitForGraphqlOperation(
      diagnostics.completedOperations,
      'getWikiPage'
    );

    await expect(page.getByTestId('wiki-page-title')).toBeVisible();
    await expect(page.getByTestId('wiki-page-feature-button')).toHaveCount(0);
  });
});
