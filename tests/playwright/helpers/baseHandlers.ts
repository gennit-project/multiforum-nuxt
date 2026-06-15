import {
  buildBasicUser,
  buildChannel,
  buildServerConfig,
  DEFAULT_USERNAME,
  type BasicUserFixture,
  type ChannelFixture,
  type ServerConfigFixture,
} from './graphqlFixtures';

export type BaseHandlerConfig = {
  username?: string;
  channelId?: string;
  discussionsCount?: number;
  commentsCount?: number;
  serverConfigOverrides?: Partial<ServerConfigFixture>;
  channelOverrides?: Partial<ChannelFixture>;
  userOverrides?: Partial<BasicUserFixture>;
  isModerator?: boolean;
  moderatorDisplayName?: string;
};

export const DEFAULT_BASE_CONFIG: BaseHandlerConfig = {
  username: DEFAULT_USERNAME,
  channelId: 'cats',
  discussionsCount: 0,
  commentsCount: 0,
};

export const createBaseHandlers = (
  config: BaseHandlerConfig = DEFAULT_BASE_CONFIG
) => {
  const {
    username = DEFAULT_USERNAME,
    channelId = 'cats',
    discussionsCount = 0,
    commentsCount = 0,
    serverConfigOverrides = {},
    channelOverrides = {},
    userOverrides = {},
    isModerator = false,
    moderatorDisplayName,
  } = config;

  return {
    getBasicUserInfo: () => ({
      data: {
        users: [
          buildBasicUser({
            username,
            displayName: username,
            CommentsAggregate: { count: commentsCount },
            DiscussionsAggregate: { count: discussionsCount },
            ...userOverrides,
          }),
        ],
      },
    }),
    getUser: () => ({
      data: {
        users: [{ username, notifyOnReplyToCommentByDefault: true }],
      },
    }),
    getUserActiveSuspensions: () => ({
      data: { users: [{ username, Suspensions: [] }] },
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
            ...serverConfigOverrides,
          }),
        ],
      },
    }),
    getChannel: () => ({
      data: {
        channels: [
          buildChannel({
            uniqueName: channelId,
            displayName: channelId,
            overrides: channelOverrides,
          }),
        ],
      },
    }),
    getUserSuspensionInChannel: () => ({
      data: {
        channels: [{ uniqueName: channelId, SuspendedUsers: [] }],
      },
    }),
    userIsModInChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: channelId,
            Admins: [],
            SuspendedUsers: [],
            Moderators: isModerator
              ? [{ displayName: moderatorDisplayName ?? username }]
              : [],
            SuspendedMods: [],
          },
        ],
      },
    }),
    getModsByChannel: () => ({
      data: {
        channels: [{ uniqueName: channelId, Admins: [], Moderators: [] }],
      },
    }),
    getEvents: () => ({ data: { events: [] } }),
    getIssue: () => ({ data: { issues: [] } }),
    getChannelDownloadCount: () => ({
      data: {
        channels: [
          {
            uniqueName: channelId,
            DiscussionChannelsAggregate: { count: discussionsCount },
          },
        ],
      },
    }),
    getUserFavoriteDiscussion: () => ({
      data: {
        users: [{ username, FavoriteDiscussions: [] }],
      },
    }),
  };
};
