import type { CommentCreateInput } from '@/__generated__/graphql';
import {
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  DEFAULT_USERNAME,
  type MockCommentState,
} from './graphqlFixtures';
import { createBaseHandlers, type BaseHandlerConfig } from './baseHandlers';

export type CommentTestConfig = {
  channelId: string;
  discussionId: string;
  discussionChannelId: string;
  discussionTitle: string;
  username?: string;
};

export const DEFAULT_COMMENT_CONFIG: CommentTestConfig = {
  channelId: 'cats',
  discussionId: 'discussion-1',
  discussionChannelId: 'discussion-channel-1',
  discussionTitle: 'Example topic 1',
  username: DEFAULT_USERNAME,
};

export type CreateCommentVariables = {
  createCommentInput?: CommentCreateInput | CommentCreateInput[];
};

export type UpdateCommentVariables = {
  commentWhere?: { id?: string };
  updateCommentInput?: { text?: string };
};

const buildCommentFixture = (
  comment: MockCommentState,
  comments: MockCommentState[],
  config: CommentTestConfig
) =>
  buildComment({
    comment,
    comments,
    channelUniqueName: config.channelId,
    discussionId: config.discussionId,
    discussionChannelId: config.discussionChannelId,
  });

export type CommentState = {
  comments: MockCommentState[];
  nextCommentId: number;
};

export const createCommentState = (): CommentState => ({
  comments: [],
  nextCommentId: 1,
});

export const createCommentHandlers = (
  state: CommentState,
  config: CommentTestConfig = DEFAULT_COMMENT_CONFIG
) => {
  const username = config.username ?? DEFAULT_USERNAME;

  const baseConfig: BaseHandlerConfig = {
    username,
    channelId: config.channelId,
    commentsCount: state.comments.length,
    discussionsCount: 1,
  };

  return {
    ...createBaseHandlers(baseConfig),

    getDiscussionCommentIssue: () => ({
      data: {
        discussionChannels: [{ id: config.discussionChannelId, Comments: [] }],
      },
    }),
    isDiscussionAnswered: () => ({
      data: {
        discussionChannels: [
          {
            id: config.discussionChannelId,
            discussionId: config.discussionId,
            channelUniqueName: config.channelId,
            weightedVotesCount: 1,
            archived: false,
            answered: false,
            locked: false,
            Channel: { uniqueName: config.channelId },
          },
        ],
      },
    }),
    getDiscussion: () => ({
      data: {
        discussions: [
          buildDiscussion({
            id: config.discussionId,
            discussionChannelId: config.discussionChannelId,
            channelUniqueName: config.channelId,
            title: config.discussionTitle,
            body: 'Example body',
            commentsCount: state.comments.length,
          }),
        ],
      },
    }),
    getCommentSection: () => ({
      data: {
        getCommentSection: {
          DiscussionChannel: buildDiscussionChannel({
            id: config.discussionChannelId,
            discussionId: config.discussionId,
            channelUniqueName: config.channelId,
            title: config.discussionTitle,
            commentsCount: state.comments.length,
          }),
          Comments: state.comments
            .filter((c) => c.parentCommentId === null)
            .map((c) => buildCommentFixture(c, state.comments, config)),
        },
      },
    }),
    getDiscussionChannelRootCommentAggregate: () => ({
      data: {
        discussionChannels: [
          {
            id: config.discussionChannelId,
            discussionId: config.discussionId,
            channelUniqueName: config.channelId,
            archived: false,
            answered: false,
            locked: false,
            CommentsAggregate: {
              count: state.comments.filter((c) => c.parentCommentId === null)
                .length,
            },
          },
        ],
      },
    }),
    getUserFavoriteComment: () => ({
      data: { getUserFavoriteComment: false },
    }),
    getCommentWithReplies: ({
      body,
    }: {
      body: { variables?: { commentId?: string } };
    }) => {
      const parentCommentId = body.variables?.commentId;
      const childComments = state.comments.filter(
        (c) => c.parentCommentId === parentCommentId
      );

      return {
        data: {
          getCommentReplies: {
            __typename: 'CommentReplies',
            aggregateChildCommentCount: childComments.length,
            ChildComments: childComments.map((c) =>
              buildCommentFixture(c, state.comments, config)
            ),
          },
        },
      };
    },
    createComment: ({
      body,
    }: {
      body: { variables?: CreateCommentVariables };
    }) => {
      const rawInput = body.variables?.createCommentInput;
      const input = Array.isArray(rawInput) ? rawInput[0] : rawInput;

      if (!input) {
        throw new Error('Missing createCommentInput');
      }

      const newComment: MockCommentState = {
        id: `comment-${state.nextCommentId++}`,
        text: input.text ?? '',
        parentCommentId: input.ParentComment?.connect?.where?.node?.id || null,
      };
      state.comments = [newComment, ...state.comments];
      return {
        data: {
          createComments: {
            comments: [buildCommentFixture(newComment, state.comments, config)],
          },
        },
      };
    },
    updateComment: ({
      body,
    }: {
      body: { variables?: UpdateCommentVariables };
    }) => {
      const commentId = body.variables?.commentWhere?.id;
      const text = body.variables?.updateCommentInput?.text ?? '';

      if (!commentId) {
        throw new Error('Missing commentWhere.id');
      }

      state.comments = state.comments.map((c) =>
        c.id === commentId ? { ...c, text } : c
      );
      const updated = state.comments.find((c) => c.id === commentId);

      if (!updated) {
        throw new Error(`Could not find comment ${commentId}`);
      }

      return {
        data: {
          updateComments: {
            comments: [buildCommentFixture(updated, state.comments, config)],
          },
        },
      };
    },
    deleteComment: ({ body }: { body: { variables?: { id?: string } } }) => {
      const commentId = body.variables?.id;
      state.comments = state.comments.filter((c) => c.id !== commentId);
      return {
        data: {
          deleteComments: { nodesDeleted: 1, relationshipsDeleted: 1 },
        },
      };
    },
  };
};
