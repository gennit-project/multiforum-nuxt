import {
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
  DEFAULT_USERNAME,
  MOCK_DATE,
} from './graphqlFixtures';
import { createBaseHandlers, type BaseHandlerConfig } from './baseHandlers';
import type { GraphQLHandler } from './mockGraphql';

// Stateful mock backing for the super-upvote ("scratchpad") give/undo flow on a
// discussion detail page. The discussion is authored by `authorUsername` (so the
// logged-in `actorUsername` is allowed to super upvote it), and the upvote /
// super-upvote relationships live in mutable arrays that the mutation handlers
// edit and the query handlers read back — mirroring the real backend so the
// frontend Apollo cache logic is exercised faithfully.
export type SuperUpvoteState = {
  channelId: string;
  discussionId: string;
  discussionChannelId: string;
  authorUsername: string;
  actorUsername: string;
  title: string;
  body: string;
  upvoters: string[];
  superUpvoters: string[];
};

export type SuperUpvoteConfig = {
  channelId?: string;
  discussionId?: string;
  discussionChannelId?: string;
  authorUsername?: string;
  actorUsername?: string;
  title?: string;
  body?: string;
  startUpvoted?: boolean;
  startSuperUpvoted?: boolean;
};

export const createSuperUpvoteState = (
  config: SuperUpvoteConfig = {}
): SuperUpvoteState => {
  const {
    channelId = 'cats',
    discussionId = 'discussion-1',
    discussionChannelId = 'discussion-channel-1',
    authorUsername = 'alice',
    actorUsername = DEFAULT_USERNAME,
    title = 'Alice has a great idea',
    body = 'Here is the body of the discussion.',
    startUpvoted = false,
    startSuperUpvoted = false,
  } = config;

  return {
    channelId,
    discussionId,
    discussionChannelId,
    authorUsername,
    actorUsername,
    title,
    body,
    upvoters: startUpvoted ? [actorUsername] : [],
    superUpvoters: startSuperUpvoted ? [actorUsername] : [],
  };
};

const toUsernameList = (usernames: string[]) =>
  usernames.map((username) => ({ __typename: 'User', username }));

// The DiscussionChannel sub-object shared by the detail queries, reflecting the
// current upvote / super-upvote state.
const buildStatefulDiscussionChannel = (state: SuperUpvoteState) =>
  buildDiscussionChannel({
    id: state.discussionChannelId,
    discussionId: state.discussionId,
    channelUniqueName: state.channelId,
    title: state.title,
    overrides: {
      weightedVotesCount: state.upvoters.length + state.superUpvoters.length,
      UpvotedByUsers: toUsernameList(state.upvoters),
      UpvotedByUsersAggregate: { count: state.upvoters.length },
      SuperUpvotedByUsers: toUsernameList(state.superUpvoters),
      Discussion: {
        id: state.discussionId,
        title: state.title,
        Author: buildUser({ username: state.authorUsername }),
      },
    },
  });

// Shape returned by the upvote / undo-upvote mutations (matches the selection
// set in graphQLData/discussion/mutations.js).
const buildVoteMutationResult = (state: SuperUpvoteState) => ({
  id: state.discussionChannelId,
  weightedVotesCount: state.upvoters.length + state.superUpvoters.length,
  UpvotedByUsers: toUsernameList(state.upvoters),
  UpvotedByUsersAggregate: { count: state.upvoters.length },
  SuperUpvotedByUsers: toUsernameList(state.superUpvoters),
  __typename: 'DiscussionChannel',
});

export const createSuperUpvoteHandlers = (
  state: SuperUpvoteState
): Record<string, GraphQLHandler> => {
  const baseConfig: BaseHandlerConfig = {
    username: state.actorUsername,
    channelId: state.channelId,
    discussionId: state.discussionId,
    discussionChannelId: state.discussionChannelId,
    discussionTitle: state.title,
    discussionsCount: 1,
  };

  return {
    ...createBaseHandlers(baseConfig),

    getDiscussion: () => ({
      data: {
        discussions: [
          buildDiscussion({
            id: state.discussionId,
            discussionChannelId: state.discussionChannelId,
            channelUniqueName: state.channelId,
            title: state.title,
            body: state.body,
            overrides: {
              Author: buildUser({ username: state.authorUsername }),
              DiscussionChannels: [buildStatefulDiscussionChannel(state)],
            },
          }),
        ],
      },
    }),

    getCommentSection: () => ({
      data: {
        getCommentSection: {
          DiscussionChannel: buildStatefulDiscussionChannel(state),
          Comments: [],
        },
      },
    }),

    getDiscussionChannelRootCommentAggregate: () => ({
      data: {
        discussionChannels: [
          {
            id: state.discussionChannelId,
            discussionId: state.discussionId,
            channelUniqueName: state.channelId,
            archived: false,
            answered: false,
            locked: false,
            CommentsAggregate: { count: 0 },
          },
        ],
      },
    }),

    getDiscussionCommentIssue: () => ({
      data: {
        discussionChannels: [
          { id: state.discussionChannelId, Comments: [] },
        ],
      },
    }),

    isDiscussionAnswered: () => ({
      data: {
        discussionChannels: [
          {
            id: state.discussionChannelId,
            discussionId: state.discussionId,
            channelUniqueName: state.channelId,
            weightedVotesCount: state.upvoters.length + state.superUpvoters.length,
            archived: false,
            answered: false,
            locked: false,
            Channel: { uniqueName: state.channelId },
          },
        ],
      },
    }),

    upvoteDiscussionChannel: () => {
      if (!state.upvoters.includes(state.actorUsername)) {
        state.upvoters.push(state.actorUsername);
      }
      return { data: { upvoteDiscussionChannel: buildVoteMutationResult(state) } };
    },

    undoUpvoteDiscussionChannel: () => {
      state.upvoters = state.upvoters.filter((u) => u !== state.actorUsername);
      // Undoing an upvote also clears any super upvote on the backend.
      state.superUpvoters = state.superUpvoters.filter(
        (u) => u !== state.actorUsername
      );
      return {
        data: { undoUpvoteDiscussionChannel: buildVoteMutationResult(state) },
      };
    },

    createScratchpadEntry: ({ body }) => {
      const variables = (body.variables ?? {}) as {
        recipientUsername?: string;
        text?: string;
        sourceType?: string;
        sourceId?: string;
        sourceChannelUniqueName?: string;
      };
      if (!state.superUpvoters.includes(state.actorUsername)) {
        state.superUpvoters.push(state.actorUsername);
      }
      return {
        data: {
          createScratchpadEntry: {
            id: 'scratchpad-entry-1',
            createdAt: MOCK_DATE,
            text: variables.text ?? '',
            isPublic: false,
            sourceType: variables.sourceType ?? 'discussion',
            sourceId: variables.sourceId ?? state.discussionChannelId,
            sourceChannelUniqueName:
              variables.sourceChannelUniqueName ?? state.channelId,
            discussionId: state.discussionId,
            Author: {
              username: state.actorUsername,
              displayName: state.actorUsername,
              profilePicURL: '',
            },
            Recipient: { username: variables.recipientUsername ?? state.authorUsername },
            superUpvotedByUsers: toUsernameList(state.superUpvoters),
            __typename: 'ScratchpadEntry',
          },
        },
      };
    },

    undoSuperUpvote: ({ body }) => {
      const variables = (body.variables ?? {}) as {
        sourceType?: string;
        sourceId?: string;
      };
      state.superUpvoters = state.superUpvoters.filter(
        (u) => u !== state.actorUsername
      );
      return {
        data: {
          undoSuperUpvote: {
            success: true,
            message: 'Super upvote removed successfully',
            sourceId: variables.sourceId ?? state.discussionChannelId,
            sourceType: variables.sourceType ?? 'discussion',
            superUpvotedByUsers: toUsernameList(state.superUpvoters),
            __typename: 'UndoSuperUpvoteResult',
          },
        },
      };
    },
  };
};

// ---------------------------------------------------------------------------
// Receiving side: a recipient who got a super upvote sees a notification with
// "Show on profile" / "Ignore" actions, and published notes appear in their
// Kudos section. State is shared so mutations reflect into later queries.
// ---------------------------------------------------------------------------

export type ReceivedSuperUpvoteState = {
  recipientUsername: string;
  senderUsername: string;
  channelId: string;
  discussionId: string;
  notificationId: string;
  entryId: string;
  noteText: string;
  read: boolean;
  isPublic: boolean;
};

export const createReceivedSuperUpvoteState = (
  config: Partial<ReceivedSuperUpvoteState> = {}
): ReceivedSuperUpvoteState => ({
  recipientUsername: 'alice',
  senderUsername: 'bob',
  channelId: 'cats',
  discussionId: 'discussion-1',
  notificationId: 'notification-1',
  entryId: 'scratchpad-entry-1',
  noteText: 'Thanks for the thoughtful post!',
  read: false,
  isPublic: false,
  ...config,
});

const buildScratchpadNotification = (state: ReceivedSuperUpvoteState) => {
  const postUrl = `/forums/${state.channelId}/discussions/${state.discussionId}`;
  const kudosUrl = `/u/${state.recipientUsername}/scratchpad`;
  return {
    __typename: 'Notification' as const,
    id: state.notificationId,
    createdAt: MOCK_DATE,
    read: state.read,
    notificationType: 'scratchpad',
    text:
      `[@${state.senderUsername}](/u/${state.senderUsername}) super upvoted your ` +
      `[post](${postUrl}) with a thank-you note: "${state.noteText}" — ` +
      `[View on your Kudos page](${kudosUrl})`,
    ScratchpadEntry: {
      __typename: 'ScratchpadEntry' as const,
      id: state.entryId,
      isPublic: state.isPublic,
    },
  };
};

const buildScratchpadEntry = (state: ReceivedSuperUpvoteState) => ({
  __typename: 'ScratchpadEntry' as const,
  id: state.entryId,
  createdAt: MOCK_DATE,
  text: state.noteText,
  isPublic: state.isPublic,
  sourceType: 'discussion',
  sourceId: 'discussion-channel-1',
  sourceChannelUniqueName: state.channelId,
  discussionId: state.discussionId,
  Author: {
    __typename: 'User' as const,
    username: state.senderUsername,
    displayName: state.senderUsername,
    profilePicURL: '',
  },
  Recipient: { __typename: 'User' as const, username: state.recipientUsername },
});

// Handlers for the /notifications page (general tab) carrying a super-upvote
// notification, plus the mutations its action buttons fire.
export const createReceivedNotificationHandlers = (
  state: ReceivedSuperUpvoteState
): Record<string, GraphQLHandler> => ({
  ...createBaseHandlers({
    username: state.recipientUsername,
    channelId: state.channelId,
  }),

  getGeneralNotifications: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username: state.recipientUsername,
          Notifications: [buildScratchpadNotification(state)],
          NotificationsAggregate: { count: state.read ? 0 : 1 },
          totalNotificationsAggregate: { count: 1 },
        },
      ],
    },
  }),

  getFeedbackNotifications: () => ({
    data: {
      users: [
        {
          __typename: 'User',
          username: state.recipientUsername,
          Notifications: [],
          NotificationsAggregate: { count: 0 },
          totalNotificationsAggregate: { count: 0 },
        },
      ],
    },
  }),

  markNotificationAsRead: () => {
    state.read = true;
    return {
      data: {
        updateUsers: {
          users: [
            {
              __typename: 'User',
              username: state.recipientUsername,
              Notifications: [
                {
                  __typename: 'Notification',
                  id: state.notificationId,
                  read: true,
                },
              ],
            },
          ],
        },
      },
    };
  },

  updateScratchpadEntryVisibility: ({ body }) => {
    const variables = (body.variables ?? {}) as { isPublic?: boolean };
    state.isPublic = variables.isPublic ?? true;
    return {
      data: {
        updateScratchpadEntryVisibility: buildScratchpadEntry(state),
      },
    };
  },
});

// Handlers for the recipient's own Kudos page, reflecting whether the note has
// been published. Reuse for asserting a published note shows up on the profile.
export const createKudosPageHandlers = (
  state: ReceivedSuperUpvoteState
): Record<string, GraphQLHandler> => ({
  ...createBaseHandlers({
    username: state.recipientUsername,
    channelId: state.channelId,
  }),

  getServerRules: () => ({ data: { serverConfigs: [{ rules: '[]' }] } }),
  getUserContributions: () => ({ data: { getUserContributions: [] } }),

  getPublicScratchpadEntries: () => ({
    data: {
      scratchpadEntries: state.isPublic ? [buildScratchpadEntry(state)] : [],
    },
  }),

  getPendingScratchpadEntries: () => ({
    data: {
      scratchpadEntries: state.isPublic ? [] : [buildScratchpadEntry(state)],
    },
  }),
});
