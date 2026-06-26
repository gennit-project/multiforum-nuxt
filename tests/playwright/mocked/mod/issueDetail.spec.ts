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
import {
  createRulesJSON,
  DEFAULT_RULES_JSON,
} from '../../helpers/moderationFixtures';

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const ISSUE_NUMBER = 1;

// Channel-scoped rule (distinct from the server rule) so the modal shows both.
const CHANNEL_RULES_JSON = createRulesJSON([
  { summary: 'No spam', detail: 'Do not post spam.' },
]);

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
  // Rules shown in the broken-rules modal: server-wide + channel-scoped.
  getServerRules: () => ({
    data: {
      serverConfigs: [{ serverName: 'Listical', rules: DEFAULT_RULES_JSON }],
    },
  }),
  getChannelRules: () => ({
    data: {
      channels: [{ uniqueName: TEST_CHANNEL, rules: CHANNEL_RULES_JSON }],
    },
  }),
});

test.describe('Moderation issue detail', () => {
  test('renders an open issue with a varied activity feed', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    // Mixed action types exercise the activity-feed label branches.
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
          moderatorDisplayName: 'mod-alice',
        }),
        buildModerationAction({
          id: 'action-close',
          actionType: 'close',
          actionDescription: 'closed the issue',
          moderatorDisplayName: 'mod-bob',
        }),
        buildModerationAction({
          id: 'action-suspend',
          actionType: 'suspension',
          actionDescription: 'suspended the user',
          moderatorDisplayName: 'mod-carol',
        }),
      ],
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getIssue: () => ({ data: { issues: [issue] } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

      await expect(
        page.getByText('Reported discussion about spam')
      ).toBeVisible();
      await expect(
        page.getByText('This discussion violates the no-spam rule.')
      ).toBeVisible();
      // ActivityFeedListItem renders a distinct passive label per action type.
      await expect(page.getByText(/was reported by/i).first()).toBeVisible();
      await expect(page.getByText(/the issue was closed by/i)).toBeVisible();
      await expect(page.getByText(/the user was suspended by/i)).toBeVisible();

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

  test('renders the moderation wizard and opens the broken-rules modal', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    // An issue tied to a related discussion renders the ModerationWizard
    // (mod actions) because the current user is a moderator, not the OP.
    const issue = buildIssue({
      issueNumber: ISSUE_NUMBER,
      channelUniqueName: TEST_CHANNEL,
      title: 'Reported discussion needing review',
      isOpen: true,
      overrides: { relatedDiscussionId: 'discussion-1' },
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      getIssue: () => ({ data: { issues: [issue] } }),
      // Related content lookup — empty list keeps IssueRelatedContent inert
      // while the wizard renders from the issue's relatedDiscussionId.
      getDiscussion: () => ({ data: { discussions: [] } }),
      // Drives the wizard's "is archived" check (false → Archive action shown).
      getDiscussionChannelID: () => ({
        data: { discussionChannels: [{ archived: false }] },
      }),
      // Author suspension check for the wizard.
      getSuspension: () => ({ data: { isOriginalPosterSuspended: false } }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

      // ModerationWizard renders an Archive action for the related discussion.
      const archiveButton = page
        .getByRole('button', { name: /Archive Discussion/i })
        .first();
      await expect(archiveButton).toBeVisible();

      // Opening it surfaces the BrokenRulesModal.
      await archiveButton.click();
      await expect(page.getByText('Archive Content')).toBeVisible();
      await expect(
        page.getByText('Please select at least one broken rule')
      ).toBeVisible();

      // The modal is populated with the server config's rules...
      await expect(page.getByText('Server Rules')).toBeVisible();
      await expect(page.getByText('Be kind')).toBeVisible();

      // ...and a rule is selectable.
      const ruleCheckbox = page.locator('input[value="Be kind"]');
      await ruleCheckbox.check();
      await expect(ruleCheckbox).toBeChecked();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
