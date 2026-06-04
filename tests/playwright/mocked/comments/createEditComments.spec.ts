import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { CommentCreateInput } from '@/__generated__/graphql';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import {
  buildBasicUser,
  buildChannel,
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  buildServerConfig,
  type MockCommentState,
} from '../../helpers/graphqlFixtures';

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

const buildCommentFixture = (
  comment: MockCommentState,
  comments: MockCommentState[]
) =>
  buildComment({
    comment,
    comments,
    channelUniqueName: CHANNEL_ID,
    discussionId: DISCUSSION_ID,
    discussionChannelId: DISCUSSION_CHANNEL_ID,
  });

const buildDiscussionResponse = (comments: MockCommentState[]) => ({
  data: {
    discussions: [
      buildDiscussion({
        id: DISCUSSION_ID,
        discussionChannelId: DISCUSSION_CHANNEL_ID,
        channelUniqueName: CHANNEL_ID,
        title: DISCUSSION_TITLE,
        body: 'Example body',
        commentsCount: comments.length,
      }),
    ],
  },
});

test('creates, edits, deletes, and nests comments', async (
  { context, page },
  testInfo
) => {
  let nextCommentId = 1;
  let comments: MockCommentState[] = [];

  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    getBasicUserInfo: () => ({
      data: {
        users: [
          buildBasicUser({
            CommentsAggregate: { count: comments.length },
            DiscussionsAggregate: { count: 1 },
          }),
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
        serverConfigs: [buildServerConfig({ serverName: 'Listical' })],
      },
    }),
    getChannel: () => ({
      data: {
        channels: [
          buildChannel({
            uniqueName: CHANNEL_ID,
            displayName: CHANNEL_ID,
          }),
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
          DiscussionChannel: buildDiscussionChannel({
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: CHANNEL_ID,
            title: DISCUSSION_TITLE,
            commentsCount: comments.length,
          }),
          Comments: comments
            .filter((comment) => comment.parentCommentId === null)
            .map((comment) => buildCommentFixture(comment, comments)),
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
    getUserFavoriteComment: () => ({
      data: {
        getUserFavoriteComment: false,
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
            __typename: 'CommentReplies',
            aggregateChildCommentCount: childComments.length,
            ChildComments: childComments.map((comment) =>
              buildCommentFixture(comment, comments)
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

      const newComment: MockCommentState = {
        id: `comment-${nextCommentId++}`,
        text: input.text ?? '',
        parentCommentId: input.ParentComment?.connect?.where?.node?.id || null,
      };
      comments = [newComment, ...comments];
      return {
        data: {
          createComments: {
            comments: [buildCommentFixture(newComment, comments)],
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
            comments: [buildCommentFixture(updated, comments)],
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
