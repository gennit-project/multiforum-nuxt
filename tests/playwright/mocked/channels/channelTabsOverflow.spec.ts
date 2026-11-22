import type { Page } from '@playwright/test';
import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// The Downloads tab is gated by BOTH the channel-level `downloadsEnabled` flag
// AND the server-wide `ServerConfig.enableDownloads` switch (ChannelTabs.vue):
// the tab only shows when the channel has downloads on AND the server allows
// downloads at all. This is the UI side of the server-wide downloads gate
// (the backend now enforces the same flag on download creation).
const TEST_CHANNEL = 'overflow-forum';
const TEST_USER = 'alice';

const getMocks = (serverEnableDownloads = true) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [buildBasicUser({ username: TEST_USER, displayName: TEST_USER })],
    },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username: TEST_USER,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserFavorites: () => ({
    data: {
      users: [{ username: TEST_USER, FavoriteChannels: [], Collections: [] }],
    },
  }),
  GetUserFavoriteChannels: () => ({
    data: { users: [{ username: TEST_USER, FavoriteChannels: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username: TEST_USER, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        // buildServerConfig takes the override fields directly (no nested
        // `overrides` key, unlike buildChannel).
        buildServerConfig({
          serverName: 'Listical',
          enableDownloads: serverEnableDownloads,
          enableEvents: true,
        }),
      ],
    },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          displayName: 'Downloads Forum',
          // The channel itself has downloads turned on; whether the tab shows
          // is then decided by the server-wide flag.
          overrides: {
            downloadsEnabled: true,
            eventsEnabled: true,
            wikiEnabled: true,
            Admins: [
              buildUser({ username: TEST_USER, displayName: TEST_USER }),
            ],
          },
        }),
      ],
    },
  }),
  getChannelTags: () => ({
    data: {
      channels: [{ __typename: 'Channel', uniqueName: TEST_CHANNEL, Tags: [] }],
    },
  }),
  getTags: () => ({ data: { tags: [] } }),
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          __typename: 'Channel',
          uniqueName: TEST_CHANNEL,
          Admins: [],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
  getDiscussionsInChannel: () => ({ data: { getDiscussionsInChannel: [] } }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [
        {
          __typename: 'Channel',
          uniqueName: TEST_CHANNEL,
          DiscussionChannelsConnection: { aggregate: { count: { nodes: 0 } } },
        },
      ],
    },
  }),
});

// Scope to the channel TAB bar specifically, and only count what's actually
// VISIBLE to the user. Reasons:
//  - Plain href is ambiguous (the global sidebar + per-forum section nav also
//    link to /forums/<forum>/downloads); only the tab bar is enableDownloads-gated.
//  - ChannelTabs renders a hidden SSR-fallback nav from the UNFILTERED baseTabs,
//    so the gated tab can linger in the DOM while not being visible. Asserting on
//    `:visible` tests the behavior the user actually sees.
// The forum page renders ChannelTabs with :desktop="false" → forum-tab-mobile-*.
const visibleTab = (page: Page, name: string) =>
  page.locator(`[data-testid="forum-tab-mobile-${name}"]:visible`);

test.describe('Channel tabs — overflow "More" menu', () => {
  test('moves tabs that do not fit into a More dropdown on narrow screens', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    await installGraphqlMocks(page, getMocks());
    await page.setViewportSize({ width: 980, height: 900 });

    await page.goto(`/forums/${TEST_CHANNEL}/discussions`);
    await expect(visibleTab(page, 'discussions')).not.toHaveCount(0);
    const more = page.locator('[data-testid="channel-tabs-more"]:visible');
    await expect(more).toHaveCount(1);
    await more.click();
    await expect(
      page.locator('[data-testid="more-dropdown-about"]')
    ).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('more-menu.png') });
  });

  test('navigates to a tab chosen from the More dropdown', async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });
    await installGraphqlMocks(page, getMocks());
    await page.setViewportSize({ width: 980, height: 900 });

    await page.goto(`/forums/${TEST_CHANNEL}/discussions`);
    await page.locator('[data-testid="channel-tabs-more"]:visible').click();
    await page.locator('[data-testid="more-dropdown-about"]').click();

    await expect(page).toHaveURL(new RegExp(`/forums/${TEST_CHANNEL}/about$`));
  });
});
