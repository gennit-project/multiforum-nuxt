import type {
  Channel,
  Comment,
  Discussion,
  DiscussionChannel,
  ServerConfig,
  User,
} from '@/__generated__/graphql';

export const MOCK_DATE = '2024-01-01T00:00:00.000Z';
export const DEFAULT_USERNAME = 'cluse';

export type MockCommentState = {
  id: string;
  text: string;
  parentCommentId: string | null;
  archived?: boolean;
};

type CountAggregate = { count: number };
type Override<T> = Partial<T>;
type TagFixture = { text: string };
type EmailFixture = { address: string };

export type UserFixture = Pick<
  User,
  | '__typename'
  | 'username'
  | 'displayName'
  | 'profilePicURL'
  | 'createdAt'
  | 'discussionKarma'
  | 'commentKarma'
  | 'ServerRoles'
  | 'ChannelRoles'
> & {
  notifyOnSuspensionBlocks: boolean;
};

export type BasicUserFixture = UserFixture &
  Pick<
    User,
    | 'location'
    | 'pronouns'
    | 'bio'
    | 'notifyOnReplyToCommentByDefault'
    | 'notifyOnReplyToDiscussionByDefault'
    | 'notifyOnReplyToEventByDefault'
    | 'notifyWhenTagged'
    | 'notifyOnFeedback'
    | 'notificationBundleInterval'
    | 'notificationBundleEnabled'
    | 'notificationBundleContent'
    | 'enableSensitiveContentByDefault'
  > & {
    Email: EmailFixture;
    notifyOnSubscribedIssueUpdates: boolean;
    NotificationsAggregate: CountAggregate;
    CommentsAggregate: CountAggregate;
    DiscussionsAggregate: CountAggregate;
    DownloadsAggregate: CountAggregate;
    EventsAggregate: CountAggregate;
    ImagesAggregate: CountAggregate;
    AlbumsAggregate: CountAggregate;
    AdminOfChannelsAggregate: CountAggregate;
  };

export type ServerConfigFixture = Pick<
  ServerConfig,
  | 'serverName'
  | 'serverIconURL'
  | 'serverDescription'
  | 'DefaultServerRole'
  | 'DefaultModRole'
  | 'DefaultElevatedModRole'
  | 'DefaultSuspendedRole'
  | 'DefaultSuspendedModRole'
  | 'rules'
  | 'allowedFileTypes'
  | 'enableDownloads'
  | 'enableEvents'
  | 'pluginRegistries'
> & {
  Admins: Array<Pick<User, 'username'>>;
  Moderators: unknown[];
};

export type ChannelFixture = Pick<
  Channel,
  | 'uniqueName'
  | 'displayName'
  | 'channelIconURL'
  | 'channelBannerURL'
  | 'description'
  | 'createdAt'
  | 'feedbackEnabled'
  | 'rules'
  | 'locked'
  | 'wikiEnabled'
  | 'eventsEnabled'
  | 'downloadsEnabled'
  | 'allowedFileTypes'
  | 'WikiHomePage'
  | 'Moderators'
  | 'SuspendedUsers'
  | 'SuspendedMods'
  | 'DefaultModRole'
  | 'ElevatedModRole'
  | 'SuspendedRole'
  | 'SuspendedModRole'
  | 'DefaultChannelRole'
  | 'FilterGroups'
> & {
  Tags: TagFixture[];
  Bots: unknown[];
  pluginPipelines: unknown[];
  DefaultElevatedModRole: null;
  Admins: UserFixture[];
  DiscussionChannelsAggregate: CountAggregate;
  IssuesAggregate: CountAggregate;
  EventChannelsAggregate: CountAggregate;
};

export type DiscussionChannelFixture = Pick<
  DiscussionChannel,
  | '__typename'
  | 'id'
  | 'discussionId'
  | 'channelUniqueName'
  | 'weightedVotesCount'
  | 'createdAt'
  | 'archived'
  | 'answered'
  | 'locked'
  | 'emoji'
  | 'LabelOptions'
  | 'Answers'
> & {
  Channel: Pick<
    Channel,
    'uniqueName' | 'channelIconURL' | 'displayName' | 'feedbackEnabled'
  > & { Bots: unknown[] };
  Discussion: Pick<Discussion, 'id' | 'title'> & { Author: UserFixture };
  CommentsAggregate: CountAggregate;
  UpvotedByUsers: Array<Pick<User, 'username'>>;
  UpvotedByUsersAggregate: CountAggregate;
  SubscribedToNotifications: Array<Pick<User, 'username'>>;
};

export type DiscussionFixture = Pick<
  Discussion,
  | 'id'
  | 'title'
  | 'body'
  | 'editReason'
  | 'createdAt'
  | 'updatedAt'
  | 'hasDownload'
  | 'hasSensitiveContent'
  | 'Album'
  | 'CrosspostedDiscussion'
  | 'DownloadableFiles'
  | 'FeedbackComments'
  | 'PastTitleVersions'
  | 'PastBodyVersions'
  | 'BodyLastEditedBy'
> & {
  coverImageURL: string;
  Tags: TagFixture[];
  Author: UserFixture;
  DiscussionChannels: DiscussionChannelFixture[];
  FeedbackCommentsAggregate: CountAggregate;
};

export type CommentFixture = Pick<
  Comment,
  | '__typename'
  | 'id'
  | 'text'
  | 'emoji'
  | 'weightedVotesCount'
  | 'createdAt'
  | 'updatedAt'
  | 'archived'
  | 'isFavoritedByUser'
  | 'FeedbackComments'
  | 'PastVersions'
  | 'Event'
> & {
  CommentAuthor: UserFixture;
  ChildCommentsAggregate: CountAggregate;
  ParentComment: Pick<Comment, 'id'> | null;
  ChildComments: CommentFixture[];
  FeedbackCommentsAggregate: CountAggregate;
  SubscribedToNotifications: Array<Pick<User, 'username'>>;
  DiscussionChannel: Pick<
    DiscussionChannel,
    '__typename' | 'id' | 'channelUniqueName' | 'discussionId'
  >;
  Channel: Pick<Channel, '__typename' | 'uniqueName'>;
  UpvotedByUsers: Array<Pick<User, 'username'>>;
  UpvotedByUsersAggregate: CountAggregate;
};

export const buildUser = (
  overrides: Override<UserFixture> = {}
): UserFixture => ({
  __typename: 'User',
  username: DEFAULT_USERNAME,
  displayName: DEFAULT_USERNAME,
  profilePicURL: '',
  createdAt: MOCK_DATE,
  discussionKarma: 0,
  commentKarma: 0,
  notifyOnSuspensionBlocks: true,
  ServerRoles: [],
  ChannelRoles: [],
  ...overrides,
});

export const buildBasicUser = (
  overrides: Override<BasicUserFixture> = {}
): BasicUserFixture => ({
  ...buildUser(),
  location: '',
  pronouns: '',
  bio: '',
  Email: { address: `${DEFAULT_USERNAME}@example.com` },
  notifyOnReplyToCommentByDefault: true,
  notifyOnReplyToDiscussionByDefault: true,
  notifyOnReplyToEventByDefault: true,
  notifyWhenTagged: true,
  notifyOnSubscribedIssueUpdates: true,
  notifyOnFeedback: true,
  notificationBundleInterval: 'daily',
  notificationBundleEnabled: false,
  notificationBundleContent: 'all',
  enableSensitiveContentByDefault: false,
  NotificationsAggregate: { count: 0 },
  CommentsAggregate: { count: 0 },
  DiscussionsAggregate: { count: 0 },
  DownloadsAggregate: { count: 0 },
  EventsAggregate: { count: 0 },
  ImagesAggregate: { count: 0 },
  AlbumsAggregate: { count: 0 },
  AdminOfChannelsAggregate: { count: 1 },
  ...overrides,
});

export const buildServerConfig = (
  overrides: Override<ServerConfigFixture> = {}
): ServerConfigFixture => ({
  serverName: 'Listical',
  serverIconURL: '',
  serverDescription: '',
  Admins: [{ username: DEFAULT_USERNAME }],
  Moderators: [],
  DefaultServerRole: null,
  DefaultModRole: null,
  DefaultElevatedModRole: null,
  DefaultSuspendedRole: null,
  DefaultSuspendedModRole: null,
  rules: '[]',
  allowedFileTypes: [],
  enableDownloads: true,
  enableEvents: true,
  pluginRegistries: [],
  ...overrides,
});

export const buildChannel = ({
  uniqueName = 'cats',
  displayName = uniqueName,
  description = '',
  tags = [],
  discussionChannelsCount = 1,
  overrides = {},
}: {
  uniqueName?: string;
  displayName?: string;
  description?: string;
  tags?: string[];
  discussionChannelsCount?: number;
  overrides?: Override<ChannelFixture>;
} = {}): ChannelFixture => ({
  uniqueName,
  displayName,
  channelIconURL: '',
  channelBannerURL: '',
  description,
  createdAt: MOCK_DATE,
  feedbackEnabled: true,
  rules: '[]',
  locked: false,
  wikiEnabled: false,
  eventsEnabled: true,
  downloadsEnabled: false,
  allowedFileTypes: [],
  pluginPipelines: [],
  WikiHomePage: null,
  Tags: tags.map((text) => ({ text })),
  Admins: [buildUser()],
  Moderators: [],
  SuspendedUsers: [],
  SuspendedMods: [],
  Bots: [],
  DefaultModRole: null,
  ElevatedModRole: null,
  DefaultElevatedModRole: null,
  SuspendedRole: null,
  SuspendedModRole: null,
  DefaultChannelRole: {
    canCreateComment: true,
    canCreateDiscussion: true,
    canCreateEvent: true,
    canUpdateChannel: true,
    canUploadFile: true,
    canUpvoteComment: true,
    canUpvoteDiscussion: true,
    channelUniqueName: uniqueName,
  },
  DiscussionChannelsAggregate: { count: discussionChannelsCount },
  IssuesAggregate: { count: 0 },
  EventChannelsAggregate: { count: 0 },
  FilterGroups: [],
  ...overrides,
});

export const buildDiscussionChannel = ({
  id = 'discussion-channel-1',
  discussionId = 'discussion-1',
  channelUniqueName = 'cats',
  title = 'Example topic 1',
  commentsCount = 0,
  overrides = {},
}: {
  id?: string;
  discussionId?: string;
  channelUniqueName?: string;
  title?: string;
  commentsCount?: number;
  overrides?: Override<DiscussionChannelFixture>;
} = {}): DiscussionChannelFixture => ({
  __typename: 'DiscussionChannel',
  id,
  discussionId,
  channelUniqueName,
  weightedVotesCount: 1,
  createdAt: MOCK_DATE,
  archived: false,
  answered: false,
  locked: false,
  emoji: '',
  Channel: {
    uniqueName: channelUniqueName,
    channelIconURL: '',
    displayName: channelUniqueName,
    feedbackEnabled: true,
    Bots: [],
  },
  Discussion: {
    id: discussionId,
    title,
    Author: buildUser(),
  },
  CommentsAggregate: { count: commentsCount },
  UpvotedByUsers: [{ username: DEFAULT_USERNAME }],
  UpvotedByUsersAggregate: { count: 1 },
  SubscribedToNotifications: [],
  Answers: [],
  LabelOptions: [],
  ...overrides,
});

export const buildDiscussion = ({
  id = 'discussion-1',
  discussionChannelId = 'discussion-channel-1',
  channelUniqueName = 'cats',
  title = 'Example topic 1',
  body = 'Example body',
  tags = [],
  commentsCount = 0,
  overrides = {},
}: {
  id?: string;
  discussionChannelId?: string;
  channelUniqueName?: string;
  title?: string;
  body?: string;
  tags?: string[];
  commentsCount?: number;
  overrides?: Override<DiscussionFixture>;
} = {}): DiscussionFixture => ({
  id,
  title,
  body,
  editReason: '',
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
  hasDownload: false,
  hasSensitiveContent: false,
  coverImageURL: '',
  Tags: tags.map((text) => ({ text })),
  Author: buildUser(),
  Album: null,
  CrosspostedDiscussion: null,
  DiscussionChannels: [
    buildDiscussionChannel({
      id: discussionChannelId,
      discussionId: id,
      channelUniqueName,
      title,
      commentsCount,
    }),
  ],
  DownloadableFiles: [],
  FeedbackCommentsAggregate: { count: 0 },
  FeedbackComments: [],
  PastTitleVersions: [],
  PastBodyVersions: [],
  BodyLastEditedBy: null,
  ...overrides,
});

export const buildComment = ({
  comment,
  comments,
  channelUniqueName = 'cats',
  discussionId = 'discussion-1',
  discussionChannelId = 'discussion-channel-1',
}: {
  comment: MockCommentState;
  comments: MockCommentState[];
  channelUniqueName?: string;
  discussionId?: string;
  discussionChannelId?: string;
}): CommentFixture => ({
  __typename: 'Comment',
  id: comment.id,
  text: comment.text,
  emoji: '',
  weightedVotesCount: 1,
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
  archived: comment.archived ?? false,
  isFavoritedByUser: false,
  CommentAuthor: buildUser(),
  ChildCommentsAggregate: {
    count: comments.filter((child) => child.parentCommentId === comment.id).length,
  },
  ParentComment: comment.parentCommentId ? { id: comment.parentCommentId } : null,
  ChildComments: comments
    .filter((child) => child.parentCommentId === comment.id)
    .map((child) =>
      buildComment({
        comment: child,
        comments,
        channelUniqueName,
        discussionId,
        discussionChannelId,
      })
    ),
  FeedbackComments: [],
  FeedbackCommentsAggregate: { count: 0 },
  PastVersions: [],
  SubscribedToNotifications: [],
  Event: null,
  DiscussionChannel: {
    __typename: 'DiscussionChannel',
    id: discussionChannelId,
    channelUniqueName,
    discussionId,
  },
  Channel: {
    __typename: 'Channel',
    uniqueName: channelUniqueName,
  },
  UpvotedByUsers: [{ username: DEFAULT_USERNAME }],
  UpvotedByUsersAggregate: { count: 1 },
});
