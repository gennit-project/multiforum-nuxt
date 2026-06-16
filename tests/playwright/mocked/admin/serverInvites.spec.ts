import { expect, test } from '@playwright/test';
import {
  buildBasicUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_USER = 'alice';

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: {
      users: [
        buildBasicUser({
          username,
          displayName: username,
        }),
      ],
    },
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
    data: {
      users: [{ username, FavoriteChannels: [], Collections: [] }],
    },
  }),
  GetUserFavoriteChannels: () => ({
    data: {
      users: [{ username, FavoriteChannels: [] }],
    },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: {
      users: [{ username, Collections: [] }],
    },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
          enableEvents: true,
        }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [
        {
          uniqueName: 'cats',
          DiscussionChannelsAggregate: { count: 1 },
        },
      ],
    },
  }),
});

test.describe('Server admin/mod invites', () => {
  test('admin invite page loads without errors', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
    });

    try {
      // Wait only for the DOM, not the full `load` event: the `auth`
      // middleware can trigger a client-side redirect that detaches the
      // frame and aborts a `load`-gated navigation (ERR_ABORTED). The
      // networkidle wait below still lets the page settle.
      await page.goto('/admin/accept-admin-invite', {
        waitUntil: 'domcontentloaded',
      });

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Page should load without JavaScript errors
      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('mod invite page loads without errors', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
    });

    try {
      // See note in the admin invite test above: wait for DOM rather than
      // the full `load` event to avoid an ERR_ABORTED from an auth redirect.
      await page.goto('/admin/accept-mod-invite', {
        waitUntil: 'domcontentloaded',
      });

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Page should load without JavaScript errors
      expect(diagnostics.pageErrors).toEqual([]);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
