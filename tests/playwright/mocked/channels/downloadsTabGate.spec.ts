import type { Page } from '@playwright/test';
import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// The Downloads tab is gated by BOTH the channel-level `downloadsEnabled` flag
// AND the server-wide `ServerConfig.enableDownloads` switch (ChannelTabs.vue):
// the tab only shows when the channel has downloads on AND the server allows
// downloads at all. This is the UI side of the server-wide downloads gate
// (the backend now enforces the same flag on download creation).
const TEST_CHANNEL = 'downloads-forum';
const TEST_USER = 'alice';

const getMocks = (serverEnableDownloads: boolean) => ({
  getBasicUserInfo: () => ({
    data: { users: [buildBasicUser({ username: TEST_USER, displayName: TEST_USER })] },
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
    data: { users: [{ username: TEST_USER, FavoriteChannels: [], Collections: [] }] },
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
          overrides: { downloadsEnabled: true, eventsEnabled: true },
        }),
      ],
    },
  }),
  getChannelTags: () => ({
    data: { channels: [{ __typename: 'Channel', uniqueName: TEST_CHANNEL, Tags: [] }] },
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
          DiscussionChannelsAggregate: { count: 0 },
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

test.describe('Downloads tab — server enableDownloads gate', () => {
  test('shows the Downloads tab when the server allows downloads', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, getMocks(true));

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions`);
      // The Discussions tab always renders, anchoring the tab bar. (The forum
      // renders both a desktop and a mobile tab bar, so each tab href appears
      // more than once — assert on presence/count rather than a single node.)
      await expect(visibleTab(page, 'discussions')).not.toHaveCount(0);
      await expect(visibleTab(page, 'downloads')).not.toHaveCount(0);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('hides the Downloads tab when the server has downloads disabled', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, getMocks(false));

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/discussions`);
      // Wait for the tab bar to render before asserting the Downloads tab is
      // absent, so the assertion can't pass merely because the page hasn't
      // booted yet.
      await expect(visibleTab(page, 'discussions')).not.toHaveCount(0);
      await expect(visibleTab(page, 'downloads')).toHaveCount(0);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
