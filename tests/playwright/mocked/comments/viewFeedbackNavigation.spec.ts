import { test, expect } from '../../helpers/testFixture';
import { expectNoAxeViolations } from '../../helpers/axe';
import {
  buildChannel,
  buildComment,
  buildDiscussion,
  buildDiscussionChannel,
  type MockCommentState,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const TEST_CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const COMMENT_ID = 'comment-1';
const COMMENT_TEXT = 'A comment with feedback to review.';

const commentState: MockCommentState = {
  id: COMMENT_ID,
  text: COMMENT_TEXT,
  parentCommentId: null,
};

const comment = buildComment({
  comment: commentState,
  comments: [commentState],
  channelUniqueName: TEST_CHANNEL,
  discussionId: DISCUSSION_ID,
  discussionChannelId: DISCUSSION_CHANNEL_ID,
});

const discussion = buildDiscussion({
  id: DISCUSSION_ID,
  discussionChannelId: DISCUSSION_CHANNEL_ID,
  channelUniqueName: TEST_CHANNEL,
  title: 'Discussion selected from the list',
  commentsCount: 1,
});

const discussionChannel = buildDiscussionChannel({
  id: DISCUSSION_CHANNEL_ID,
  discussionId: DISCUSSION_ID,
  channelUniqueName: TEST_CHANNEL,
  title: discussion.title,
  commentsCount: 1,
  overrides: {
    Discussion: discussion,
  },
});

test('opens comment feedback from a discussion selected in list query state', async ({
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
        discussionId: DISCUSSION_ID,
        discussionChannelId: DISCUSSION_CHANNEL_ID,
        discussionsCount: 1,
        commentsCount: 1,
      }),
      getDiscussionsInChannel: () => ({
        data: {
          getDiscussionsInChannel: {
            aggregateDiscussionChannelsCount: 1,
            discussionChannels: [discussionChannel],
          },
        },
      }),
      getDiscussion: () => ({ data: { discussions: [discussion] } }),
      getCommentSection: () => ({
        data: {
          getCommentSection: {
            DiscussionChannel: discussionChannel,
            Comments: [comment],
          },
        },
      }),
      getDiscussionChannelRootCommentAggregate: () => ({
        data: { discussionChannels: [discussionChannel] },
      }),
      isDiscussionAnswered: () => ({
        data: { discussionChannels: [discussionChannel] },
      }),
      getDiscussionCommentIssue: () => ({
        data: {
          discussionChannels: [{ id: DISCUSSION_CHANNEL_ID, Comments: [] }],
        },
      }),
      getDiscussionChannels: () => ({
        data: {
          discussionChannels: [
            { id: DISCUSSION_CHANNEL_ID, RelatedIssues: [] },
          ],
        },
      }),
      getUserFavoriteComment: () => ({
        data: { getUserFavoriteComment: false },
      }),
      getChannel: () => ({
        data: { channels: [buildChannel({ uniqueName: TEST_CHANNEL })] },
      }),
      getFeedbackOnComment: () => ({
        data: {
          comments: [
            {
              ...comment,
              FeedbackCommentsConnection: { aggregate: { count: { nodes: 0 } } },
              FeedbackComments: [],
            },
          ],
        },
      }),
    },
  });

  // In a forum's split view `selectedDiscussionId` carries the discussion's
  // per-forum number (the mocked discussion channel defaults to 1).
  await page.goto(
    `/forums/${TEST_CHANNEL}/discussions?selectedDiscussionId=1`
  );

  const renderedComment = page
    .locator('[data-testid="comment"]')
    .filter({ hasText: COMMENT_TEXT });
  await expect(renderedComment).toBeVisible({ timeout: 60_000 });
  await expectNoAxeViolations(page);

  await renderedComment
    .getByRole('button', { name: 'Feedback actions' })
    .click();
  await page.getByText('View Feedback', { exact: true }).click();

  // The discussion segment is the per-forum number (or the raw id when the
  // mocked channel carries no discussionNumber); the comment stays a raw id.
  await expect(page).toHaveURL(
    new RegExp(
      `/forums/${TEST_CHANNEL}/discussions/commentFeedback/[^/]+/${COMMENT_ID}$`
    )
  );
  await expect(
    page.getByRole('heading', { name: 'Feedback', exact: true })
  ).toBeVisible();
  await expect(page.getByText(COMMENT_TEXT)).toBeVisible();
});
