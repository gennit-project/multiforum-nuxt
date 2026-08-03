import { expect, test } from '../../helpers/testFixture';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  buildDiscussion,
  buildDiscussionChannel,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import type { Album } from '@/__generated__/graphql';

const CHANNEL = 'cats';
const DISCUSSION_ID = 'discussion-with-reported-image';
const DISCUSSION_CHANNEL_ID = 'discussion-channel-with-reported-image';
const IMAGE_ID = 'image-to-report';

const image = {
  __typename: 'Image' as const,
  id: IMAGE_ID,
  url: '/favicon.ico',
  alt: 'Image that violates a rule',
  caption: 'Reported from the lightbox',
  copyright: '',
  Uploader: { username: 'bob', displayName: 'Bob' },
};

test('reports an album image from the lightbox with the selected rules', async ({
  context,
  page,
}, testInfo) => {
  await installMockAuth(context, page, {
    username: 'alice',
    email: 'alice@example.com',
  });

  const diagnostics = await installGraphqlMocks(page, {
    ...createBaseHandlers({
      username: 'alice',
      channelId: CHANNEL,
      discussionId: DISCUSSION_ID,
      discussionChannelId: DISCUSSION_CHANNEL_ID,
      discussionsCount: 1,
    }),
    getDiscussion: () => ({
      data: {
        discussions: [
          buildDiscussion({
            id: DISCUSSION_ID,
            discussionChannelId: DISCUSSION_CHANNEL_ID,
            channelUniqueName: CHANNEL,
            body: 'Lightbox report test.',
            overrides: {
              Album: {
                __typename: 'Album',
                id: 'album-1',
                imageOrder: [IMAGE_ID],
                Images: [image],
              } as unknown as Album,
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
            channelUniqueName: CHANNEL,
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
            channelUniqueName: CHANNEL,
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
        discussionChannels: [{ id: DISCUSSION_CHANNEL_ID, Comments: [] }],
      },
    }),
    isDiscussionAnswered: () => ({
      data: {
        discussionChannels: [
          {
            id: DISCUSSION_CHANNEL_ID,
            discussionId: DISCUSSION_ID,
            channelUniqueName: CHANNEL,
            weightedVotesCount: 1,
            archived: false,
            answered: false,
            locked: false,
            Channel: { uniqueName: CHANNEL },
          },
        ],
      },
    }),
    getUserFavoriteImage: () => ({
      data: { users: [{ username: 'alice', FavoriteImages: [] }] },
    }),
    getServerRules: () => ({
      data: {
        serverConfigs: [
          {
            serverName: 'Listical',
            rules: JSON.stringify([
              { summary: 'Be kind', detail: 'Be civil.' },
            ]),
          },
        ],
      },
    }),
    getChannelRules: () => ({
      data: {
        channels: [
          {
            uniqueName: CHANNEL,
            rules: JSON.stringify([{ summary: 'No spam', detail: 'No spam.' }]),
          },
        ],
      },
    }),
    reportImage: () => ({
      data: { reportImage: { id: 'image-issue-1', issueNumber: 7 } },
    }),
  });

  try {
    await page.goto(`/forums/${CHANNEL}/discussions/${DISCUSSION_ID}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('discussion-album-carousel')).toBeVisible();
    await page.getByTestId('discussion-album-carousel').click();
    await page.getByRole('button', { name: 'Report image' }).click();
    await page.locator('input[value="Be kind"]').check();
    await page.getByTestId('report-image-modal-primary-button').click();

    await waitForGraphqlOperation(
      diagnostics.completedOperations,
      'reportImage'
    );
    const operation = diagnostics.completedOperations.find(
      (item) => item.operationName === 'reportImage'
    );

    expect(operation?.variables).toEqual({
      imageId: IMAGE_ID,
      reportText: '',
      selectedForumRules: [],
      selectedServerRules: ['Be kind'],
      channelUniqueName: CHANNEL,
    });
  } finally {
    await testInfo.attach('graphql-operations.json', {
      body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
      contentType: 'application/json',
    });
  }
});
