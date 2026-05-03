import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { CommentCreateInput } from '@/__generated__/graphql';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const CHANNEL_ID = 'cats';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const DISCUSSION_TITLE = 'Example topic 1';
const ROOT_COMMENT_TEXT = 'Test comment';
const UPDATED_ROOT_COMMENT_TEXT = 'This is my updated comment';
const REPLY_ONE = 'Test comment 2';
const REPLY_TWO = 'Test comment 3';
const REPLY_THREE = 'Test comment 4';
const REPLY_FOUR = 'Test comment 5';

const clickInlineSave = async (scope: Page | Locator) => {
  const save = scope.getByText('Save', { exact: true }).last();
  await expect(save).toBeVisible();
  await save.click({ force: true });
};

type CommentState = {
  id: string;
  text: string;
  parentCommentId: string | null;
  archived?: boolean;
};

type CommentNode = {
  __typename: 'Comment';
  id: string;
  text: string;
  emoji: string;
  weightedVotesCount: number;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  isFavoritedByUser: boolean;
  CommentAuthor: ReturnType<typeof buildUser>;
  ChildCommentsAggregate: {
    count: number;
  };
  ParentComment: { id: string } | null;
  ChildComments: CommentNode[];
  FeedbackComments: Array<{ id: string }>;
  FeedbackCommentsAggregate: {
    count: number;
  };
  PastVersions: Array<Record<string, unknown>>;
  SubscribedToNotifications: Array<{ username: string }>;
  Event: null;
  DiscussionChannel: {
    __typename: 'DiscussionChannel';
    id: string;
    channelUniqueName: string;
    discussionId: string;
  };
  Channel: {
    __typename: 'Channel';
    uniqueName: string;
  };
  UpvotedByUsers: Array<{ username: string }>;
  UpvotedByUsersAggregate: {
    count: number;
  };
};

type CreateCommentVariables = {
  createCommentInput?: CommentCreateInput | CommentCreateInput[];
};

type UpdateCommentVariables = {
  commentWhere?: {
    id?: string;
  };
  updateCommentInput?: {
    text?: string;
  };
};

const buildUser = () => ({
  __typename: 'User',
  username: 'cluse',
  displayName: 'cluse',
  profilePicURL: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  discussionKarma: 0,
  commentKarma: 0,
  notifyOnSuspensionBlocks: true,
  ServerRoles: [],
  ChannelRoles: [],
});

const buildCommentNode = (
  comment: CommentState,
  comments: CommentState[]
): CommentNode => ({
  __typename: 'Comment',
  id: comment.id,
  text: comment.text,
  emoji: '',
  weightedVotesCount: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  archived: comment.archived ?? false,
  isFavoritedByUser: false,
  CommentAuthor: buildUser(),
  ChildCommentsAggregate: {
    count: comments.filter((child) => child.parentCommentId === comment.id).length,
  },
  ParentComment: comment.parentCommentId ? { id: comment.parentCommentId } : null,
  ChildComments: comments
    .filter((child) => child.parentCommentId === comment.id)
    .map((child) => buildCommentNode(child, comments)),
  FeedbackComments: [],
  FeedbackCommentsAggregate: { count: 0 },
  PastVersions: [],
  SubscribedToNotifications: [],
  Event: null,
  DiscussionChannel: {
    __typename: 'DiscussionChannel',
    id: DISCUSSION_CHANNEL_ID,
    channelUniqueName: CHANNEL_ID,
    discussionId: DISCUSSION_ID,
  },
  Channel: {
    __typename: 'Channel',
    uniqueName: CHANNEL_ID,
  },
  UpvotedByUsers: [{ username: 'cluse' }],
  UpvotedByUsersAggregate: { count: 1 },
});

const buildComment = (comment: CommentState, comments: CommentState[]) => ({
  ...buildCommentNode(comment, comments),
});

const buildDiscussionResponse = (comments: CommentState[]) => ({
  data: {
    discussions: [
      {
        id: DISCUSSION_ID,
        title: DISCUSSION_TITLE,
        body: 'Example body',
        editReason: '',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        hasDownload: false,
        hasSensitiveContent: false,
        coverImageURL: '',
        Tags: [],
        Author: buildUser(),
        Album: null,
        CrosspostedDiscussion: null,
        DiscussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: CHANNEL_ID,
            weightedVotesCount: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            archived: false,
            answered: false,
            locked: false,
            emoji: '',
            Channel: {
              uniqueName: CHANNEL_ID,
              displayName: 'cats',
              feedbackEnabled: true,
              Bots: [],
            },
            Discussion: {
              id: DISCUSSION_ID,
              title: DISCUSSION_TITLE,
              Author: buildUser(),
            },
            CommentsAggregate: { count: comments.length },
            UpvotedByUsers: [{ username: 'cluse' }],
            UpvotedByUsersAggregate: { count: 1 },
            SubscribedToNotifications: [],
            Answers: [],
          },
        ],
        PastTitleVersions: [],
        PastBodyVersions: [],
      },
    ],
  },
});

test('creates, edits, deletes, and nests comments', async (
  { context, page },
  testInfo
) => {
  let nextCommentId = 1;
  let comments: CommentState[] = [];

  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    getBasicUserInfo: () => ({
      data: {
        users: [
          {
            ...buildUser(),
            location: '',
            pronouns: '',
            bio: '',
            Email: { address: 'cluse@example.com' },
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
            CommentsAggregate: { count: comments.length },
            DiscussionsAggregate: { count: 1 },
            DownloadsAggregate: { count: 0 },
            EventsAggregate: { count: 0 },
            ImagesAggregate: { count: 0 },
            AlbumsAggregate: { count: 0 },
            AdminOfChannelsAggregate: { count: 1 },
          },
        ],
      },
    }),
    getUser: () => ({
      data: {
        users: [
          {
            username: 'cluse',
            notifyOnReplyToCommentByDefault: true,
          },
        ],
      },
    }),
    getUserActiveSuspensions: () => ({
      data: { users: [{ username: 'cluse', Suspensions: [] }] },
    }),
    getUserFavorites: () => ({
      data: {
        users: [{ username: 'cluse', FavoriteChannels: [], Collections: [] }],
      },
    }),
    getServerConfig: () => ({
      data: {
        serverConfigs: [
          {
            serverName: 'Listical',
            serverIconURL: '',
            serverDescription: '',
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
          },
        ],
      },
    }),
    getChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: CHANNEL_ID,
            displayName: CHANNEL_ID,
            channelIconURL: '',
            channelBannerURL: '',
            description: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            feedbackEnabled: true,
            rules: '[]',
            locked: false,
            wikiEnabled: false,
            eventsEnabled: true,
            downloadsEnabled: false,
            allowedFileTypes: [],
            pluginPipelines: [],
            WikiHomePage: null,
            Tags: [],
            Admins: [
              {
                username: 'cluse',
                displayName: 'cluse',
                profilePicURL: '',
                commentKarma: 0,
                discussionKarma: 0,
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
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
              channelUniqueName: CHANNEL_ID,
            },
            DiscussionChannelsAggregate: { count: 1 },
            IssuesAggregate: { count: 0 },
            EventChannelsAggregate: { count: 0 },
            FilterGroups: [],
          },
        ],
      },
    }),
    getIssue: () => ({ data: { issues: [] } }),
    getDiscussionCommentIssue: () => ({
      data: {
        discussionChannels: [{ id: DISCUSSION_CHANNEL_ID, Comments: [] }],
      },
    }),
    getChannelDownloadCount: () => ({
      data: {
        channels: [
          {
            uniqueName: CHANNEL_ID,
            DiscussionChannelsAggregate: { count: 1 },
          },
        ],
      },
    }),
    getEvents: () => ({
      data: {
        events: [],
      },
    }),
    isDiscussionAnswered: () => ({
      data: {
        discussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: CHANNEL_ID,
            weightedVotesCount: 1,
            archived: false,
            answered: false,
            locked: false,
            Channel: { uniqueName: CHANNEL_ID },
          },
        ],
      },
    }),
    getModsByChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: CHANNEL_ID,
            Admins: [],
            Moderators: [],
          },
        ],
      },
    }),
    getUserFavoriteDiscussion: () => ({
      data: {
        users: [{ username: 'cluse', FavoriteDiscussions: [] }],
      },
    }),
    getUserSuspensionInChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: CHANNEL_ID,
            SuspendedUsers: [],
          },
        ],
      },
    }),
    userIsModInChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: CHANNEL_ID,
            Admins: [],
            SuspendedUsers: [],
            Moderators: [],
            SuspendedMods: [],
          },
        ],
      },
    }),
    getDiscussion: () => buildDiscussionResponse(comments),
    getCommentSection: () => ({
      data: {
        getCommentSection: {
          DiscussionChannel: {
            id: DISCUSSION_CHANNEL_ID,
            weightedVotesCount: 1,
            discussionId: DISCUSSION_ID,
            channelUniqueName: CHANNEL_ID,
            emoji: '',
            archived: false,
            locked: false,
            answered: false,
            Channel: {
              uniqueName: CHANNEL_ID,
              feedbackEnabled: true,
              Bots: [],
            },
            Discussion: {
              id: DISCUSSION_ID,
              title: DISCUSSION_TITLE,
              Author: buildUser(),
            },
            CommentsAggregate: { count: comments.length },
            UpvotedByUsers: [{ username: 'cluse' }],
            UpvotedByUsersAggregate: { count: 1 },
            SubscribedToNotifications: [],
            Answers: [],
          },
          Comments: comments
            .filter((comment) => comment.parentCommentId === null)
            .map((comment) => buildComment(comment, comments)),
        },
      },
    }),
    getDiscussionChannelRootCommentAggregate: () => ({
      data: {
        discussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: CHANNEL_ID,
            archived: false,
            answered: false,
            locked: false,
            CommentsAggregate: {
              count: comments.filter((comment) => comment.parentCommentId === null)
                .length,
            },
          },
        ],
      },
    }),
    getCommentWithReplies: ({ body }) => {
      const parentCommentId = body.variables?.commentId as string | undefined;
      const childComments = comments.filter(
        (comment) => comment.parentCommentId === parentCommentId
      );

      return {
        data: {
          getCommentReplies: {
            aggregateChildCommentCount: childComments.length,
            ChildComments: childComments.map((comment) =>
              buildComment(comment, comments)
            ),
          },
        },
      };
    },
    createComment: ({ body }) => {
      const variables = body.variables as CreateCommentVariables | undefined;
      const rawInput = variables?.createCommentInput;
      const input = Array.isArray(rawInput) ? rawInput[0] : rawInput;

      if (!input) {
        throw new Error('Missing createCommentInput in mocked createComment request');
      }

      const newComment: CommentState = {
        id: `comment-${nextCommentId++}`,
        text: input.text ?? '',
        parentCommentId: input.ParentComment?.connect?.where?.node?.id || null,
      };
      comments = [newComment, ...comments];
      return {
        data: {
          createComments: {
            comments: [buildComment(newComment, comments)],
          },
        },
      };
    },
    updateComment: ({ body }) => {
      const variables = body.variables as UpdateCommentVariables | undefined;
      const commentId = variables?.commentWhere?.id;
      const text = variables?.updateCommentInput?.text ?? '';

      if (!commentId) {
        throw new Error('Missing commentWhere.id in mocked updateComment request');
      }

      comments = comments.map((comment) =>
        comment.id === commentId ? { ...comment, text } : comment
      );
      const updated = comments.find((comment) => comment.id === commentId);

      if (!updated) {
        throw new Error(`Could not find updated comment ${commentId}`);
      }

      return {
        data: {
          updateComments: {
            comments: [buildComment(updated, comments)],
          },
        },
      };
    },
    deleteComment: ({ body }) => {
      const commentId = body.variables?.id as string;
      comments = comments.filter((comment) => comment.id !== commentId);
      return {
        data: {
          deleteComments: {
            nodesDeleted: 1,
            relationshipsDeleted: 1,
          },
        },
      };
    },
  });

  try {
    const discussionUrl = `/forums/${CHANNEL_ID}/discussions/${DISCUSSION_ID}`;

    await page.goto(discussionUrl);
    await expect(page.getByRole('heading', { name: DISCUSSION_TITLE })).toBeVisible();

    await page.getByTestId('addComment').click();
    await page.getByTestId('texteditor-textarea').fill(ROOT_COMMENT_TEXT);
    await page.getByTestId('createCommentButton').click();
    await page.goto(discussionUrl);
    await expect(page.getByText(ROOT_COMMENT_TEXT)).toBeVisible();

    let rootComment = page.getByTestId('comment').filter({
      hasText: ROOT_COMMENT_TEXT,
    });
    await rootComment.getByRole('button', { name: 'Comment actions' }).click();
    await page.locator('.v-list-item').filter({ hasText: 'Edit' }).click();
    await page.getByTestId('texteditor-textarea').fill(UPDATED_ROOT_COMMENT_TEXT);
    await clickInlineSave(page);
    await page.goto(discussionUrl);
    await expect(page.getByText(UPDATED_ROOT_COMMENT_TEXT)).toBeVisible();

    rootComment = page.getByTestId('comment').filter({
      hasText: UPDATED_ROOT_COMMENT_TEXT,
    });
    await rootComment.getByRole('button', { name: 'Comment actions' }).click();
    await page.locator('.v-list-item').filter({ hasText: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.goto(discussionUrl);
    await expect(page.getByText(UPDATED_ROOT_COMMENT_TEXT)).toHaveCount(0);

    await page.getByTestId('addComment').click();
    await page.getByTestId('texteditor-textarea').fill(ROOT_COMMENT_TEXT);
    await page.getByTestId('createCommentButton').click();
    await page.goto(discussionUrl);
    const recreatedRootComment = page.getByTestId('comment').filter({
      hasText: ROOT_COMMENT_TEXT,
    });
    await expect(recreatedRootComment).toBeVisible();

    await recreatedRootComment.getByRole('button', { name: 'Reply' }).click();
    const firstReplyEditor = recreatedRootComment.getByTestId(
      'texteditor-textarea'
    ).last();
    await expect(firstReplyEditor).toBeVisible();
    await firstReplyEditor.fill(REPLY_ONE);
    await clickInlineSave(recreatedRootComment);
    await page.goto(discussionUrl);
    const firstLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_ONE,
    });
    await expect(firstLevelComment).toBeVisible();

    await firstLevelComment.getByRole('button', { name: 'Reply' }).first().click();
    const secondReplyEditor = firstLevelComment.getByTestId(
      'texteditor-textarea'
    ).last();
    await expect(secondReplyEditor).toBeVisible();
    await secondReplyEditor.fill(REPLY_TWO);
    await clickInlineSave(firstLevelComment);
    await page.goto(discussionUrl);
    const secondLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_TWO,
    });
    await expect(secondLevelComment).toBeVisible();

    await secondLevelComment.getByRole('button', { name: 'Reply' }).first().click();
    const thirdReplyEditor = secondLevelComment.getByTestId(
      'texteditor-textarea'
    ).last();
    await expect(thirdReplyEditor).toBeVisible();
    await thirdReplyEditor.fill(REPLY_THREE);
    await clickInlineSave(secondLevelComment);
    await page.goto(discussionUrl);
    const thirdLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_THREE,
    });
    await expect(thirdLevelComment).toBeVisible();

    await thirdLevelComment.getByRole('button', { name: 'Reply' }).first().click();
    const fourthReplyEditor = thirdLevelComment.getByTestId(
      'texteditor-textarea'
    ).last();
    await expect(fourthReplyEditor).toBeVisible();
    await fourthReplyEditor.fill(REPLY_FOUR);
    await clickInlineSave(thirdLevelComment);
    await page.goto(discussionUrl);
    const fourthLevelComment = page.getByTestId('comment').filter({
      hasText: REPLY_FOUR,
    });
    await expect(fourthLevelComment).toBeVisible();

    expect(diagnostics.pageErrors).toEqual([]);
  } finally {
    await testInfo.attach('graphql-operations.json', {
      body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
      contentType: 'application/json',
    });
    await testInfo.attach('page-errors.json', {
      body: Buffer.from(JSON.stringify(diagnostics.pageErrors, null, 2)),
      contentType: 'application/json',
    });
    await testInfo.attach('console-errors.json', {
      body: Buffer.from(JSON.stringify(diagnostics.consoleErrors, null, 2)),
      contentType: 'application/json',
    });
  }
});
