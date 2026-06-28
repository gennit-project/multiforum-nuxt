import { test, expect } from '../../helpers/testFixture';
import {
  buildChannel,
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
  type MockCommentState,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

// Workflow: "Verify Server Admin/Server Mod Badge on Comments"
//
// On a discussion comment section, a comment authored by a ServerConfig.Admins
// member shows a "Server Admin" badge; a comment authored by a regular user does
// not. This exercises the full Comment.vue -> useServerRoleMembership ->
// getServerRoleBadge -> CommentHeader chain.

const TEST_CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const DISCUSSION_TITLE = 'Discussion with admin and regular comments';

const ADMIN_USER = 'admin-sam';
const REGULAR_USER = 'regular-rita';
const ADMIN_COMMENT_ID = 'comment-admin';
const REGULAR_COMMENT_ID = 'comment-regular';
const ADMIN_COMMENT_TEXT = 'A comment authored by a server admin.';
const REGULAR_COMMENT_TEXT = 'A comment authored by a regular user.';

const adminCommentState: MockCommentState = {
  id: ADMIN_COMMENT_ID,
  text: ADMIN_COMMENT_TEXT,
  parentCommentId: null,
};
const regularCommentState: MockCommentState = {
  id: REGULAR_COMMENT_ID,
  text: REGULAR_COMMENT_TEXT,
  parentCommentId: null,
};
const mockComments: MockCommentState[] = [adminCommentState, regularCommentState];

const buildCommentFixture = (comment: MockCommentState) =>
  buildComment({
    comment,
    comments: mockComments,
    channelUniqueName: TEST_CHANNEL,
    discussionId: DISCUSSION_ID,
    discussionChannelId: DISCUSSION_CHANNEL_ID,
  });

test('shows a Server Admin badge only on the server admin comment', async ({
  page,
  setupMockedPage,
}) => {
  await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'alice',
        channelId: TEST_CHANNEL,
        discussionsCount: 1,
        // admin-sam is a server admin; nobody is a server moderator.
        serverConfigOverrides: {
          Admins: [{ username: ADMIN_USER }],
          Moderators: [],
        },
      }),
      getDiscussionCommentIssue: () => ({
        data: {
          discussionChannels: [{ id: DISCUSSION_CHANNEL_ID, Comments: [] }],
        },
      }),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: DISCUSSION_ID,
              discussionChannelId: DISCUSSION_CHANNEL_ID,
              channelUniqueName: TEST_CHANNEL,
              title: DISCUSSION_TITLE,
              commentsCount: 2,
              overrides: { Author: buildUser({ username: 'cluse' }) },
            }),
          ],
        },
      }),
      getCommentSection: () => ({
        data: {
          getCommentSection: {
            DiscussionChannel: buildDiscussionChannel({
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
              title: DISCUSSION_TITLE,
              commentsCount: 2,
            }),
            Comments: [
              {
                ...buildCommentFixture(adminCommentState),
                CommentAuthor: buildUser({ username: ADMIN_USER }),
              },
              {
                ...buildCommentFixture(regularCommentState),
                CommentAuthor: buildUser({ username: REGULAR_USER }),
              },
            ],
          },
        },
      }),
      getDiscussionChannelRootCommentAggregate: () => ({
        data: {
          discussionChannels: [
            {
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
              archived: false,
              answered: false,
              locked: false,
              CommentsAggregate: { count: 2 },
            },
          ],
        },
      }),
      isDiscussionAnswered: () => ({
        data: {
          discussionChannels: [
            {
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
              weightedVotesCount: 1,
              archived: false,
              answered: false,
              locked: false,
              Channel: { uniqueName: TEST_CHANNEL },
            },
          ],
        },
      }),
      getChannel: () => ({
        data: { channels: [buildChannel({ uniqueName: TEST_CHANNEL })] },
      }),
      getUserFavoriteComment: () => ({
        data: { getUserFavoriteComment: false },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

  // Both comments render. Generous timeout for a possible cold compile.
  await expect(page.getByText(ADMIN_COMMENT_TEXT)).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText(REGULAR_COMMENT_TEXT)).toBeVisible();

  const adminComment = page
    .locator('[data-testid="comment"]')
    .filter({ hasText: ADMIN_COMMENT_TEXT });
  const regularComment = page
    .locator('[data-testid="comment"]')
    .filter({ hasText: REGULAR_COMMENT_TEXT });

  // The server admin's comment carries a "Server Admin" badge...
  await expect(adminComment.getByText('Server Admin').first()).toBeVisible();
  // ...and the regular user's comment does not.
  await expect(regularComment.getByText('Server Admin')).toHaveCount(0);
});

test('shows a Server Mod badge on a comment authored with a mod profile', async ({
  page,
  setupMockedPage,
}) => {
  const MOD_PROFILE = 'mod-mary';
  const MOD_COMMENT_ID = 'comment-mod';
  const MOD_COMMENT_TEXT = 'A comment authored with a mod profile.';

  const modCommentState: MockCommentState = {
    id: MOD_COMMENT_ID,
    text: MOD_COMMENT_TEXT,
    parentCommentId: null,
  };
  const modComments: MockCommentState[] = [modCommentState];

  await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'alice',
        channelId: TEST_CHANNEL,
        discussionsCount: 1,
        // mod-mary is a server moderator (acting via their mod profile).
        serverConfigOverrides: {
          Admins: [],
          Moderators: [
            { displayName: MOD_PROFILE, User: { username: 'mary' } },
          ],
        },
      }),
      getDiscussionCommentIssue: () => ({
        data: {
          discussionChannels: [{ id: DISCUSSION_CHANNEL_ID, Comments: [] }],
        },
      }),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: DISCUSSION_ID,
              discussionChannelId: DISCUSSION_CHANNEL_ID,
              channelUniqueName: TEST_CHANNEL,
              title: DISCUSSION_TITLE,
              commentsCount: 1,
              overrides: { Author: buildUser({ username: 'cluse' }) },
            }),
          ],
        },
      }),
      getCommentSection: () => ({
        data: {
          getCommentSection: {
            DiscussionChannel: buildDiscussionChannel({
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
              title: DISCUSSION_TITLE,
              commentsCount: 1,
            }),
            Comments: [
              {
                ...buildComment({
                  comment: modCommentState,
                  comments: modComments,
                  channelUniqueName: TEST_CHANNEL,
                  discussionId: DISCUSSION_ID,
                  discussionChannelId: DISCUSSION_CHANNEL_ID,
                }),
                CommentAuthor: {
                  __typename: 'ModerationProfile',
                  displayName: MOD_PROFILE,
                },
              },
            ],
          },
        },
      }),
      getDiscussionChannelRootCommentAggregate: () => ({
        data: {
          discussionChannels: [
            {
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
              archived: false,
              answered: false,
              locked: false,
              CommentsAggregate: { count: 1 },
            },
          ],
        },
      }),
      isDiscussionAnswered: () => ({
        data: {
          discussionChannels: [
            {
              id: DISCUSSION_CHANNEL_ID,
              discussionId: DISCUSSION_ID,
              channelUniqueName: TEST_CHANNEL,
              weightedVotesCount: 1,
              archived: false,
              answered: false,
              locked: false,
              Channel: { uniqueName: TEST_CHANNEL },
            },
          ],
        },
      }),
      getChannel: () => ({
        data: { channels: [buildChannel({ uniqueName: TEST_CHANNEL })] },
      }),
      getUserFavoriteComment: () => ({
        data: { getUserFavoriteComment: false },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

  await expect(page.getByText(MOD_COMMENT_TEXT)).toBeVisible({
    timeout: 60_000,
  });

  const modComment = page
    .locator('[data-testid="comment"]')
    .filter({ hasText: MOD_COMMENT_TEXT });
  await expect(modComment.getByText('Server Mod').first()).toBeVisible();
});
