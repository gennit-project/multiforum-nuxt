import { test, expect } from '../../helpers/testFixture';
import {
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const TEST_CHANNEL = 'sourceit';
const DISCUSSION_ID = 'discussion-1';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-1';
const DISCUSSION_TITLE = 'A discussion with a narrow header';
const AUTHOR_USERNAME = 'cluse';

test('keeps the discussion author avatar aligned with the identity on narrow screens', async ({
  page,
  setupMockedPage,
}) => {
  await page.setViewportSize({ width: 600, height: 800 });

  const { diagnostics } = await setupMockedPage({
    username: 'viewer',
    email: 'viewer@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'viewer',
        channelId: TEST_CHANNEL,
        discussionsCount: 1,
        serverConfigOverrides: {
          Admins: [{ username: AUTHOR_USERNAME }],
        },
      }),
      getModsByChannel: () => ({
        data: {
          channels: [
            {
              uniqueName: TEST_CHANNEL,
              Admins: [{ username: AUTHOR_USERNAME }],
              Moderators: [],
            },
          ],
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
              overrides: {
                Author: buildUser({
                  username: AUTHOR_USERNAME,
                  displayName: 'Catherine',
                }),
              },
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
            }),
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
              archived: false,
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
              archived: false,
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
      getDiscussionChannels: () => ({
        data: {
          discussionChannels: [
            { id: DISCUSSION_CHANNEL_ID, RelatedIssues: [] },
          ],
        },
      }),
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/discussions/${DISCUSSION_ID}`);

  const authorRow = page.getByTestId('discussion-author-row');
  await expect(authorRow).toBeVisible({ timeout: 30000 });

  const avatarBox = await page
    .getByTestId('discussion-author-avatar')
    .boundingBox();
  const identityBox = await page
    .getByTestId('discussion-author-details')
    .locator('a')
    .boundingBox();

  expect({
    avatarTop: Math.round(avatarBox?.y ?? -1),
    identityTop: Math.round(identityBox?.y ?? -2),
    pageErrors: diagnostics.pageErrors,
  }).toEqual({
    avatarTop: Math.round(identityBox?.y ?? -2),
    identityTop: Math.round(identityBox?.y ?? -2),
    pageErrors: [],
  });
});
