import { expect, test } from '../../helpers/testFixture';
import {
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';

const TEST_CHANNEL = 'downloads-forum';
const TEST_USER = 'alice';
const DISCUSSION_ID = 'download-1';
const DISCUSSION_CHANNEL_ID = 'download-channel-1';
const DOWNLOAD_TITLE = 'Test Download';

const buildDownload = ({ withActivity }: { withActivity: boolean }) => {
  const discussionChannel = {
    ...buildDiscussionChannel({
      id: DISCUSSION_CHANNEL_ID,
      discussionId: DISCUSSION_ID,
      channelUniqueName: TEST_CHANNEL,
      title: DOWNLOAD_TITLE,
    }),
    LabelChangeHistory: withActivity
      ? [
          {
            id: 'label-change-1',
            createdAt: '2024-02-01T12:00:00.000Z',
            actionType: 'added',
            labelDisplayName: 'Tools',
            labelValue: 'tools',
            ActorUser: buildUser({
              username: TEST_USER,
              displayName: 'Alice',
            }),
            ActorMod: null,
          },
        ]
      : [],
  };

  return buildDiscussion({
    id: DISCUSSION_ID,
    discussionChannelId: DISCUSSION_CHANNEL_ID,
    channelUniqueName: TEST_CHANNEL,
    title: DOWNLOAD_TITLE,
    body: 'This is a test download.',
    overrides: {
      hasDownload: true,
      Author: buildUser({
        username: TEST_USER,
        displayName: 'Alice',
      }),
      DiscussionChannels: [discussionChannel],
      PastTitleVersions: withActivity
        ? [
            {
              id: 'title-version-1',
              body: 'Old Download Title',
              editReason: 'Clarified the title',
              createdAt: '2024-01-15T12:00:00.000Z',
              Author: null,
              AuthorConnection: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
                totalCount: 0,
              },
            },
          ]
        : [],
    },
  });
};

const createDownloadHandlers = ({
  withActivity,
}: {
  withActivity: boolean;
}) => ({
  ...createBaseHandlers({
    username: TEST_USER,
    channelId: TEST_CHANNEL,
    discussionId: DISCUSSION_ID,
    discussionChannelId: DISCUSSION_CHANNEL_ID,
    discussionTitle: DOWNLOAD_TITLE,
    discussionsCount: 1,
    channelOverrides: {
      displayName: 'Downloads Forum',
      eventsEnabled: false,
      downloadsEnabled: true,
    },
  }),
  getDiscussion: () => ({
    data: { discussions: [buildDownload({ withActivity })] },
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
  GetPublicCollectionsForDownload: () => ({
    data: { publicCollectionsContaining: [] },
  }),
  getDownloadLabels: () => ({
    data: {
      discussions: [
        {
          id: DISCUSSION_ID,
          DiscussionChannels: [
            {
              channelUniqueName: TEST_CHANNEL,
              LabelOptions: [],
            },
          ],
        },
      ],
    },
  }),
});

test.describe('Download detail Activity tab', () => {
  test('navigates to Activity and renders title and label history', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: TEST_USER,
      email: 'alice@example.com',
      handlers: createDownloadHandlers({ withActivity: true }),
    });

    await page.goto(`/forums/${TEST_CHANNEL}/downloads/${DISCUSSION_ID}`);

    const activityTab = page.getByRole('link', {
      name: 'Activity',
      exact: true,
    });
    await expect(activityTab).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole('link', { name: 'Description', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Comments (0)', exact: true })
    ).toBeVisible();

    await activityTab.click();
    await expect(page).toHaveURL(
      `/forums/${TEST_CHANNEL}/downloads/${DISCUSSION_ID}/activity`
    );

    await expect(
      page.getByText('Title Edit History', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Old Download Title', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Label Change History', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Tools', { exact: true })).toBeVisible();
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('shows the empty state when the download has no activity', async ({
    page,
    setupMockedPage,
  }) => {
    const { diagnostics } = await setupMockedPage({
      username: TEST_USER,
      email: 'alice@example.com',
      handlers: createDownloadHandlers({ withActivity: false }),
    });

    await page.goto(
      `/forums/${TEST_CHANNEL}/downloads/${DISCUSSION_ID}/activity`
    );

    await expect(
      page.getByText('No activity to display yet.', { exact: true })
    ).toBeVisible({
      timeout: 30000,
    });
    expect(diagnostics.pageErrors).toEqual([]);
  });
});
