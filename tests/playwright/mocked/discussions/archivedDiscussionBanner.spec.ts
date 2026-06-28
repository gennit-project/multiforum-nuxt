import { test, expect } from '../../helpers/testFixture';
import {
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

// Workflow: "Verify Archived Discussion Banner Shows Immediately" /
// "...from Multiple Entry Points".
//
// Navigating to an already-archived discussion must show the archived banner on
// the FIRST render — no refresh. The detail page derives `isArchived` from two
// separate queries (getCommentSection + getDiscussion) specifically so the
// banner is present in the initial data; this test guards that behaviour.

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const DISCUSSION_TITLE = 'An archived discussion';
const ISSUE_NUMBER = 7;

test('shows the archived banner on initial load with a link to the related issue', async ({
  page,
  setupMockedPage,
}) => {
  const archivedDiscussionChannel = () =>
    buildDiscussionChannel({
      id: DISCUSSION_CHANNEL_ID,
      discussionId: DISCUSSION_ID,
      channelUniqueName: TEST_CHANNEL,
      title: DISCUSSION_TITLE,
      overrides: { archived: true },
    });

  const { diagnostics } = await setupMockedPage({
    username: TEST_USER,
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: TEST_USER,
        channelId: TEST_CHANNEL,
        discussionsCount: 1,
      }),
      getDiscussion: () => ({
        data: {
          discussions: [
            buildDiscussion({
              id: DISCUSSION_ID,
              discussionChannelId: DISCUSSION_CHANNEL_ID,
              channelUniqueName: TEST_CHANNEL,
              title: DISCUSSION_TITLE,
              overrides: {
                Author: buildUser({ username: 'bob' }),
                DiscussionChannels: [archivedDiscussionChannel()],
              },
            }),
          ],
        },
      }),
      getCommentSection: () => ({
        data: {
          getCommentSection: {
            DiscussionChannel: archivedDiscussionChannel(),
            Comments: [],
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
              archived: true,
              answered: false,
              locked: false,
              CommentsAggregate: { count: 0 },
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
              archived: true,
              answered: false,
              locked: false,
              Channel: { uniqueName: TEST_CHANNEL },
            },
          ],
        },
      }),
      getDiscussionCommentIssue: () => ({
        data: {
          discussionChannels: [{ id: DISCUSSION_CHANNEL_ID, Comments: [] }],
        },
      }),
      // GET_DISCUSSION_ISSUE (the banner's own query) — surfaces the issue link.
      getDiscussionChannels: () => ({
        data: {
          discussionChannels: [
            {
              id: DISCUSSION_CHANNEL_ID,
              RelatedIssues: [{ id: 'issue-1', issueNumber: ISSUE_NUMBER }],
            },
          ],
        },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

  // Banner is present from the first render — no refresh required.
  const banner = page.getByTestId('archived-discussion-banner');
  await expect(banner).toBeVisible({ timeout: 30000 });
  await expect(banner).toContainText('New comments cannot be added.');

  // When the discussion is linked to an issue, the banner links to it.
  await expect(
    banner.getByRole('link', { name: 'archived' })
  ).toHaveAttribute('href', new RegExp(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`));

  expect(diagnostics.pageErrors).toEqual([]);
});
