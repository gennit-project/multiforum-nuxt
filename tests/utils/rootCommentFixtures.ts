import type { CreateCommentMutation, GetCommentQuery } from '@/__generated__/operations';
import type { RootCommentSection } from '@/types/DiscussionPresentation';
import { makeReply } from './replyFixtures';
export const makeCreatedComment = (): NonNullable<
  CreateCommentMutation['createCommentWithOwnedConnections']
>['comments'][number] => ({
  ...makeReply({ id: 'new', ParentComment: null }),
  Channel: null,
  ChildComments: [],
  PastVersions: [],
  CommentAuthor: null,
});
export const makeRootSection = (
  discussionId = 'd1',
  channelUniqueName = 'cats'
): RootCommentSection => ({
  Comments: [],
  DiscussionChannel: {
    id: `${discussionId}-${channelUniqueName}`,
    discussionId,
    channelUniqueName,
    weightedVotesCount: 0,
    emoji: null,
    archived: false,
    locked: false,
    answered: false,
    UpvotedByUsers: [],
    UpvotedByUsersConnection: { aggregate: { count: { nodes: 0 } } },
    SuperUpvotedByUsers: [],
    Channel: null,
    Discussion: null,
    CommentsConnection: { aggregate: { count: { nodes: 0 } } },
    RootCommentsConnection: { aggregate: { count: { nodes: 0 } } },
    SubscribedToNotifications: [],
    Answers: [],
    detailAnswersPageInfo: { endCursor: null, hasNextPage: false },
  },
});

export const makeHydratedAnswer = (overrides: Partial<GetCommentQuery['comments'][number]> = {}): GetCommentQuery['comments'][number] => ({
  ...makeReply({ id: 'c1', text: 'A comment', ParentComment: null }),
  GivesFeedbackOnComment: null,
  GivesFeedbackOnDiscussion: null,
  GivesFeedbackOnEvent: null,
  Channel: null,
  ...overrides,
});
