import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { buildChannel } from '../../helpers/graphqlFixtures';
import { waitForGraphqlOperation } from '../../helpers/mockGraphql';

const channelId = 'cats';
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

test('forum admin can pin a wiki page from site-wide search', async ({
  page,
  setupMockedPage,
}) => {
  const baseHandlers = createBaseHandlers({
    channelId,
    channelOverrides: { wikiEnabled: true },
  });
  let isPinned = false;
  const pinnedWikiPageIds: string[] = [];

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
      getChannelNames: () => ({
        data: {
          channels: [
            {
              uniqueName: channelId,
              displayName: 'Cats',
              channelIconURL: '',
              description: '',
              eventsEnabled: true,
            },
          ],
        },
      }),
      getSiteWideWikiList: () => ({
        data: {
          getSiteWideWikiList: {
            aggregateWikiPageCount: 1,
            featuredWikiPages: [],
            wikiPages: [feedingPage],
          },
        },
      }),
      getWikiPinChannels: () => ({
        data: {
          channels: [
            {
              ...buildChannel({
                uniqueName: channelId,
                displayName: 'Cats',
                overrides: { wikiEnabled: true },
              }),
              ElevatedChannelRole: null,
              PinnedWikiPages: isPinned ? [feedingPage] : [],
            },
          ],
        },
      }),
      pinWikiPageToChannel: ({
        body,
      }: {
        body: { variables?: { wikiPageId?: string } };
      }) => {
        isPinned = true;
        if (body.variables?.wikiPageId) {
          pinnedWikiPageIds.push(body.variables.wikiPageId);
        }
        return { data: { pinWikiPageToChannel: true } };
      },
    },
  });

  await page.goto('/wiki/search');
  await waitForGraphqlOperation(
    diagnostics.completedOperations,
    'getWikiPinChannels'
  );

  const resultCard = page
    .getByTestId('wiki-search-card')
    .filter({ hasText: 'Feeding guide' });
  await resultCard.getByRole('button', { name: 'Pin to sidebar' }).click();

  await expect(
    resultCard.getByRole('button', { name: 'Unpin from sidebar' })
  ).toBeVisible();
  expect(pinnedWikiPageIds).toEqual(['wiki-feeding']);
  expect(diagnostics.pageErrors).toEqual([]);
  expect(diagnostics.consoleErrors).toEqual([]);
});
