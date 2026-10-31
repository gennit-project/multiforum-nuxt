import type { ReplyComment } from '@/types/Comment';

/** Exact selected fields: no full schema entity or assertion is needed. */
export const makeReply = (
  overrides: Partial<ReplyComment> = {}
): ReplyComment => ({
  id: 'reply',
  text: 'Reply body',
  emoji: null,
  weightedVotesCount: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: null,
  textLastEdited: null,
  archived: false,
  isSticky: false,
  stickyAt: null,
  stickyByUsername: null,
  isFavoritedByUser: null,
  CommentAuthor: null,
  ChildCommentsConnection: { aggregate: { count: { nodes: 0 } } },
  ParentComment: { id: 'root' },
  PastVersions: [],
  SubscribedToNotifications: [],
  Event: null,
  DiscussionChannel: {
    id: 'dc1',
    discussionId: 'd1',
    channelUniqueName: 'cats',
  },
  UpvotedByUsers: [],
  UpvotedByUsersConnection: { aggregate: { count: { nodes: 0 } } },
  SuperUpvotedByUsers: [],
  FeedbackComments: [],
  ...overrides,
});
