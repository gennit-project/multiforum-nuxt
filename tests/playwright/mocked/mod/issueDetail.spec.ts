import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildUser,
  buildIssue,
  buildModerationAction,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const ISSUE_NUMBER = 1;

// Base operations the app shell + channel/issues layout fire on any
// authenticated channel-issue page. The current user is a channel admin so the
// moderation UI renders.
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
    data: { serverConfigs: [buildServerConfig({ serverName: 'Listical' })] },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: TEST_CHANNEL,
          overrides: { Admins: [buildUser({ username })] },
        }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          DiscussionChannelsAggregate: { count: 0 },
        },
      ],
    },
  }),
  getModsByChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          SuspendedModsAggregate: { count: 0 },
          SuspendedMods: [],
        },
      ],
    },
  }),
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: TEST_CHANNEL,
          Admins: [{ username }],
          SuspendedUsers: [],
          Moderators: [],
          SuspendedMods: [],
        },
      ],
    },
  }),
  countOpenIssues: () => ({ data: { issuesAggregate: { count: 1 } } }),
  countClosedIssues: () => ({ data: { issuesAggregate: { count: 0 } } }),
  getEvents: () => ({
    data: { events: [], eventsAggregate: { count: 0 } },
  }),
});

test.describe('Moderation issue detail', () => {
  test('renders an open issue with its activity feed', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const issue = buildIssue({
      issueNumber: ISSUE_NUMBER,
      channelUniqueName: TEST_CHANNEL,
      title: 'Reported discussion about spam',
      body: 'This discussion violates the no-spam rule.',
      isOpen: true,
      activityFeed: [
        buildModerationAction({
          id: 'action-report',
          actionType: 'report',
          actionDescription: 'reported this discussion',
        }),
      ],
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getIssue: () => ({ data: { issues: [issue] } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

      // Issue body/title render once the issue query resolves.
      await expect(
        page.getByText('Reported discussion about spam')
      ).toBeVisible();
      await expect(
        page.getByText('This discussion violates the no-spam rule.')
      ).toBeVisible();
      // The moderation activity feed renders the report action label.
      await expect(page.getByText(/reported by/i).first()).toBeVisible();

      await waitForGraphqlOperation(diagnostics.completedOperations, 'getIssue');
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('shows the locked banner for a locked issue', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const issue = buildIssue({
      issueNumber: ISSUE_NUMBER,
      channelUniqueName: TEST_CHANNEL,
      title: 'Locked issue',
      isOpen: true,
      locked: true,
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getIssue: () => ({ data: { issues: [issue] } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

      await expect(page.getByText('Locked for review')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
