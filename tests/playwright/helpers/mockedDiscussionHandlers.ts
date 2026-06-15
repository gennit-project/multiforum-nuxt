import type {
  DiscussionCreateInputWithChannels,
  DiscussionUpdateInput,
} from '@/__generated__/graphql';
import {
  MOCK_DATE,
  buildChannel,
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
  DEFAULT_USERNAME,
} from './graphqlFixtures';
import { createBaseHandlers, type BaseHandlerConfig } from './baseHandlers';

export type DiscussionTestConfig = {
  channelId: string;
  username: string;
};

export const DEFAULT_DISCUSSION_CONFIG: DiscussionTestConfig = {
  channelId: 'cats',
  username: DEFAULT_USERNAME,
};

export type MockDiscussionState = {
  id: string;
  discussionChannelId: string;
  title: string;
  body: string;
  tags: string[];
  deleted: boolean;
};

export type DiscussionState = {
  discussions: MockDiscussionState[];
  nextDiscussionId: number;
};

export const createDiscussionState = (): DiscussionState => ({
  discussions: [],
  nextDiscussionId: 1,
});

type CreateDiscussionVariables = {
  input?: DiscussionCreateInputWithChannels[];
};

type UpdateDiscussionVariables = {
  updateDiscussionInput?: DiscussionUpdateInput;
};

const buildDiscussionResponse = (
  discussion: MockDiscussionState,
  channelId: string
) => ({
  data: {
    discussions: discussion.deleted
      ? []
      : [
          buildDiscussion({
            id: discussion.id,
            discussionChannelId: discussion.discussionChannelId,
            channelUniqueName: channelId,
            title: discussion.title,
            body: discussion.body,
            tags: discussion.tags,
          }),
        ],
  },
});

const buildDiscussionListResponse = (
  discussion: MockDiscussionState,
  channelId: string
) => ({
  data: {
    getDiscussionsInChannel: {
      aggregateDiscussionChannelsCount: discussion.deleted ? 0 : 1,
      discussionChannels: discussion.deleted
        ? []
        : [
            {
              id: discussion.discussionChannelId,
              discussionId: discussion.id,
              channelUniqueName: channelId,
              isFavorited: false,
              CommentsAggregate: { count: 0 },
              weightedVotesCount: 1,
              createdAt: MOCK_DATE,
              Channel: { uniqueName: channelId },
              UpvotedByUsers: [{ username: DEFAULT_USERNAME }],
              UpvotedByUsersAggregate: { count: 1 },
              locked: false,
              archived: false,
              answered: false,
              Discussion: {
                id: discussion.id,
                title: discussion.title,
                body: discussion.body,
                createdAt: MOCK_DATE,
                updatedAt: MOCK_DATE,
                hasSensitiveContent: false,
                Author: buildUser(),
                Album: null,
                Tags: discussion.tags.map((text) => ({ text })),
              },
            },
          ],
    },
  },
});

export const createDiscussionHandlers = (
  state: DiscussionState,
  config: DiscussionTestConfig = DEFAULT_DISCUSSION_CONFIG
) => {
  const getActiveDiscussion = (): MockDiscussionState | undefined =>
    state.discussions.find((d) => !d.deleted);

  const baseConfig: BaseHandlerConfig = {
    username: config.username,
    channelId: config.channelId,
    discussionsCount: state.discussions.filter((d) => !d.deleted).length,
  };

  return {
    ...createBaseHandlers(baseConfig),

    getDiscussion: () => {
      const discussion = getActiveDiscussion();
      if (!discussion) {
        return { data: { discussions: [] } };
      }
      return buildDiscussionResponse(discussion, config.channelId);
    },

    getCommentSection: () => {
      const discussion = getActiveDiscussion();
      return {
        data: {
          getCommentSection: {
            DiscussionChannel:
              !discussion || discussion.deleted
                ? null
                : buildDiscussionChannel({
                    id: discussion.discussionChannelId,
                    discussionId: discussion.id,
                    channelUniqueName: config.channelId,
                    title: discussion.title,
                  }),
            Comments: [],
          },
        },
      };
    },

    getDiscussionChannelRootCommentAggregate: () => {
      const discussion = getActiveDiscussion();
      return {
        data: {
          discussionChannels:
            !discussion || discussion.deleted
              ? []
              : [
                  {
                    id: discussion.discussionChannelId,
                    discussionId: discussion.id,
                    channelUniqueName: config.channelId,
                    archived: false,
                    answered: false,
                    locked: false,
                    CommentsAggregate: { count: 0 },
                  },
                ],
        },
      };
    },

    getDiscussionCommentIssue: () => {
      const discussion = getActiveDiscussion();
      return {
        data: {
          discussionChannels: [
            {
              id: discussion?.discussionChannelId ?? 'discussion-channel-1',
              Comments: [],
            },
          ],
        },
      };
    },

    isDiscussionAnswered: () => {
      const discussion = getActiveDiscussion();
      if (!discussion) {
        return { data: { discussionChannels: [] } };
      }
      return {
        data: {
          discussionChannels: [
            {
              id: discussion.discussionChannelId,
              discussionId: discussion.id,
              channelUniqueName: config.channelId,
              weightedVotesCount: 1,
              archived: false,
              answered: false,
              locked: false,
              Channel: { uniqueName: config.channelId },
            },
          ],
        },
      };
    },

    getDiscussionsInChannel: () => {
      const discussion = getActiveDiscussion();
      if (!discussion) {
        return {
          data: {
            getDiscussionsInChannel: {
              aggregateDiscussionChannelsCount: 0,
              discussionChannels: [],
            },
          },
        };
      }
      return buildDiscussionListResponse(discussion, config.channelId);
    },

    createDiscussion: ({ body }: { body: { variables?: CreateDiscussionVariables } }) => {
      const input = body.variables?.input?.[0]?.discussionCreateInput;

      if (!input) {
        throw new Error(
          'Missing discussionCreateInput in mocked createDiscussion request'
        );
      }

      const id = `discussion-${state.nextDiscussionId++}`;
      const discussionChannelId = `discussion-channel-${id}`;

      const newDiscussion: MockDiscussionState = {
        id,
        discussionChannelId,
        title: input.title,
        body: input.body ?? '',
        tags:
          input.Tags?.connectOrCreate
            ?.map((tag) => tag.where.node.text)
            .filter((tag): tag is string => Boolean(tag)) || [],
        deleted: false,
      };

      state.discussions = [newDiscussion, ...state.discussions];

      return {
        data: {
          createDiscussionWithChannelConnections: [
            {
              id: newDiscussion.id,
              title: newDiscussion.title,
              body: newDiscussion.body,
              DiscussionChannels: [
                {
                  id: newDiscussion.discussionChannelId,
                  archived: false,
                  answered: false,
                  locked: false,
                  discussionId: newDiscussion.id,
                  channelUniqueName: config.channelId,
                  CommentsAggregate: { count: 0 },
                  weightedVotesCount: 1,
                  createdAt: MOCK_DATE,
                  Channel: { uniqueName: config.channelId },
                  Discussion: { id: newDiscussion.id },
                  UpvotedByUsers: [{ username: config.username }],
                  UpvotedByUsersAggregate: { count: 1 },
                },
              ],
              Author: { username: config.username },
              createdAt: MOCK_DATE,
              updatedAt: MOCK_DATE,
              Tags: newDiscussion.tags.map((text) => ({ text })),
            },
          ],
        },
      };
    },

    updateDiscussionWithChannelConnections: ({
      body,
    }: {
      body: { variables?: UpdateDiscussionVariables };
    }) => {
      const update = body.variables?.updateDiscussionInput;
      const discussion = getActiveDiscussion();

      if (!discussion) {
        throw new Error('No active discussion to update');
      }

      discussion.title = update?.title ?? discussion.title;
      discussion.body = update?.body ?? discussion.body;
      discussion.tags =
        update?.Tags?.[0]?.connectOrCreate
          ?.map((tag) => tag.where.node.text)
          .filter((tag): tag is string => Boolean(tag)) || discussion.tags;

      return {
        data: {
          updateDiscussionWithChannelConnections: {
            id: discussion.id,
            title: discussion.title,
            body: discussion.body,
            DiscussionChannels: [
              {
                id: discussion.discussionChannelId,
                channelUniqueName: config.channelId,
                discussionId: discussion.id,
                Channel: { uniqueName: config.channelId },
                archived: false,
                answered: false,
                locked: false,
              },
            ],
            createdAt: MOCK_DATE,
            updatedAt: MOCK_DATE,
            Tags: discussion.tags.map((text) => ({ text })),
          },
        },
      };
    },

    deleteDiscussion: () => {
      const discussion = getActiveDiscussion();
      if (discussion) {
        discussion.deleted = true;
      }
      return {
        data: {
          deleteDiscussions: {
            nodesDeleted: 1,
            relationshipsDeleted: 1,
          },
        },
      };
    },

    getTags: () => ({
      data: { tags: [] },
    }),

    getChannelNames: () => ({
      data: {
        channels: [
          {
            uniqueName: config.channelId,
            displayName: config.channelId,
            channelIconURL: '',
            description: '',
          },
        ],
      },
    }),

    getChannel: () => ({
      data: {
        channels: [buildChannel({ uniqueName: config.channelId })],
      },
    }),
  };
};
