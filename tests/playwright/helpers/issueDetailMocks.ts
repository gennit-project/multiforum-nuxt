import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  buildUser,
} from './graphqlFixtures';
import { DEFAULT_RULES_JSON, DEFAULT_MOD_ROLE } from './moderationFixtures';

/**
 * Base GraphQL operations fired by the app shell + channel/issues layout when an
 * authenticated channel admin opens an issue-detail page
 * (`/forums/[forumId]/issues/[issueNumber]`).
 *
 * The current user is a channel admin so the moderation UI renders and the user
 * resolves `canReport` / `canSuspendUser` permissions. Spread this into a test's
 * handler map and override `getIssue` (and any related-content / mutation
 * handlers) for the scenario under test.
 */
export const getIssueDetailBaseMocks = ({
  username,
  channel = 'cats',
}: {
  username: string;
  channel?: string;
}) => ({
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
  getUserActiveSuspensions: () => ({
    data: { users: [{ username, Suspensions: [] }] },
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
        buildServerConfig({
          serverName: 'Listical',
          rules: DEFAULT_RULES_JSON,
          DefaultModRole: DEFAULT_MOD_ROLE,
          DefaultElevatedModRole: DEFAULT_MOD_ROLE,
        }),
      ],
    },
  }),
  getChannel: () => ({
    data: {
      channels: [
        buildChannel({
          uniqueName: channel,
          overrides: {
            rules: DEFAULT_RULES_JSON,
            Admins: [buildUser({ username })],
            DefaultModRole: DEFAULT_MOD_ROLE,
            ElevatedModRole: DEFAULT_MOD_ROLE,
          },
        }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [
        { uniqueName: channel, DiscussionChannelsAggregate: { count: 0 } },
      ],
    },
  }),
  getModsByChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: channel,
          SuspendedModsAggregate: { count: 0 },
          SuspendedMods: [],
        },
      ],
    },
  }),
  getUserSuspensionInChannel: () => ({
    data: { channels: [{ uniqueName: channel, SuspendedUsers: [] }] },
  }),
  // The current user is a channel admin -> resolves full mod permissions.
  userIsModInChannel: () => ({
    data: {
      channels: [
        {
          uniqueName: channel,
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
  getEvents: () => ({ data: { events: [], eventsAggregate: { count: 0 } } }),
  // Rules shown in the broken-rules report modal.
  getServerRules: () => ({
    data: {
      serverConfigs: [{ serverName: 'Listical', rules: DEFAULT_RULES_JSON }],
    },
  }),
  getChannelRules: () => ({
    data: { channels: [{ uniqueName: channel, rules: DEFAULT_RULES_JSON }] },
  }),
  // Related-content lookups default to empty so IssueRelatedContent stays inert
  // unless a test overrides them.
  getDiscussion: () => ({ data: { discussions: [] } }),
  // SuspendModButton's "is the target mod already suspended?" check.
  getSuspension: () => ({ data: { isOriginalPosterSuspended: false } }),
});
