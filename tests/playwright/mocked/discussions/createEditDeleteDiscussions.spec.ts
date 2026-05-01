import { expect, test } from '@playwright/test';
import type {
  DiscussionCreateInputWithChannels,
  DiscussionUpdateInput,
} from '@/__generated__/graphql';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'cats';
const TEST_DISCUSSION = 'Test discussion title';
const TEST_BODY = 'Test description';
const UPDATED_BODY = 'Test description 2';
const TAG_ONE = 'trivia';
const TAG_TWO = 'music';
const TAG_THREE = 'newYears';

type DiscussionState = {
  id: string;
  discussionChannelId: string;
  title: string;
  body: string;
  tags: string[];
  deleted: boolean;
};

type CreateDiscussionVariables = {
  input?: DiscussionCreateInputWithChannels[];
};

type UpdateDiscussionVariables = {
  updateDiscussionInput?: DiscussionUpdateInput;
};

const buildUser = () => ({
  username: 'cluse',
  displayName: 'cluse',
  profilePicURL: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  discussionKarma: 0,
  commentKarma: 0,
  ServerRoles: [],
  ChannelRoles: [],
});

const buildChannel = (uniqueName: string) => ({
  uniqueName,
  displayName: uniqueName,
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
    channelUniqueName: uniqueName,
  },
  DiscussionChannelsAggregate: { count: 1 },
  IssuesAggregate: { count: 0 },
  EventChannelsAggregate: { count: 0 },
  FilterGroups: [],
});

const buildDiscussionResponse = (state: DiscussionState) => ({
  data: {
    discussions: state.deleted
      ? []
      : [
          {
            id: state.id,
            title: state.title,
            body: state.body,
            editReason: '',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            hasDownload: false,
            hasSensitiveContent: false,
            coverImageURL: '',
            Tags: state.tags.map((text) => ({ text })),
            Author: buildUser(),
            Album: null,
            CrosspostedDiscussion: null,
            DiscussionChannels: [
              {
                id: state.discussionChannelId,
                discussionId: state.id,
                channelUniqueName: TEST_CHANNEL,
                weightedVotesCount: 1,
                createdAt: '2024-01-01T00:00:00.000Z',
                archived: false,
                answered: false,
                locked: false,
                emoji: '',
                Channel: {
                  uniqueName: TEST_CHANNEL,
                  displayName: 'cats',
                  feedbackEnabled: true,
                  Bots: [],
                },
                Discussion: {
                  id: state.id,
                  title: state.title,
                  Author: buildUser(),
                },
                CommentsAggregate: { count: 0 },
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

const buildDiscussionListResponse = (state: DiscussionState) => ({
  data: {
    getDiscussionsInChannel: {
      aggregateDiscussionChannelsCount: state.deleted ? 0 : 1,
      discussionChannels: state.deleted
        ? []
        : [
            {
              id: state.discussionChannelId,
              discussionId: state.id,
              channelUniqueName: TEST_CHANNEL,
              isFavorited: false,
              CommentsAggregate: { count: 0 },
              weightedVotesCount: 1,
              createdAt: '2024-01-01T00:00:00.000Z',
              Channel: { uniqueName: TEST_CHANNEL },
              UpvotedByUsers: [{ username: 'cluse' }],
              UpvotedByUsersAggregate: { count: 1 },
              locked: false,
              archived: false,
              answered: false,
              Discussion: {
                id: state.id,
                title: state.title,
                body: state.body,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                hasSensitiveContent: false,
                Author: buildUser(),
                Album: null,
                Tags: state.tags.map((text) => ({ text })),
              },
            },
          ],
    },
  },
});

test('creates, edits and deletes a discussion', async (
  { context, page },
  testInfo
) => {
  let state: DiscussionState = {
    id: 'discussion-1',
    discussionChannelId: 'discussion-channel-1',
    title: TEST_DISCUSSION,
    body: TEST_BODY,
    tags: [TAG_ONE, TAG_TWO],
    deleted: false,
  };

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
            CommentsAggregate: { count: 0 },
            DiscussionsAggregate: { count: state.deleted ? 0 : 1 },
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
    GetUserFavoriteChannels: () => ({
      data: {
        users: [{ username: 'cluse', FavoriteChannels: [] }],
      },
    }),
    GetUserChannelCollectionsWithChannels: () => ({
      data: {
        users: [{ username: 'cluse', Collections: [] }],
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
    getTags: () => ({
      data: {
        tags: [{ text: TAG_ONE }, { text: TAG_TWO }, { text: TAG_THREE }],
      },
    }),
    getChannelNames: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            displayName: 'cats',
            channelIconURL: '',
          },
        ],
      },
    }),
    createDiscussion: ({ body }) => {
      const variables = body.variables as CreateDiscussionVariables | undefined;
      const input = variables?.input?.[0]?.discussionCreateInput;

      if (!input) {
        throw new Error('Missing discussionCreateInput in mocked createDiscussion request');
      }

      state = {
        ...state,
        title: input.title,
        body: input.body ?? '',
        tags:
          input.Tags?.connectOrCreate?.map(
            (tag) => tag.where.node.text
          ).filter((tag): tag is string => Boolean(tag)) || [],
        deleted: false,
      };
      return {
        data: {
          createDiscussionWithChannelConnections: [
            {
              id: state.id,
              title: state.title,
              body: state.body,
              DiscussionChannels: [
                {
                  id: state.discussionChannelId,
                  archived: false,
                  answered: false,
                  locked: false,
                  discussionId: state.id,
                  channelUniqueName: TEST_CHANNEL,
                  CommentsAggregate: { count: 0 },
                  weightedVotesCount: 1,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  Channel: { uniqueName: TEST_CHANNEL },
                  Discussion: { id: state.id },
                  UpvotedByUsers: [{ username: 'cluse' }],
                  UpvotedByUsersAggregate: { count: 1 },
                },
              ],
              Author: { username: 'cluse' },
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              Tags: state.tags.map((text) => ({ text })),
            },
          ],
        },
      };
    },
    getDiscussion: () => buildDiscussionResponse(state),
    getCommentSection: () => ({
      data: {
        getCommentSection: {
          DiscussionChannel: state.deleted
            ? null
            : {
                id: state.discussionChannelId,
                weightedVotesCount: 1,
                discussionId: state.id,
                channelUniqueName: TEST_CHANNEL,
                emoji: '',
                archived: false,
                locked: false,
                answered: false,
                Channel: {
                  uniqueName: TEST_CHANNEL,
                  feedbackEnabled: true,
                  Bots: [],
                },
                Discussion: {
                  id: state.id,
                  title: state.title,
                  Author: buildUser(),
                },
                CommentsAggregate: { count: 0 },
                UpvotedByUsers: [{ username: 'cluse' }],
                UpvotedByUsersAggregate: { count: 1 },
                SubscribedToNotifications: [],
                Answers: [],
              },
          Comments: [],
        },
      },
    }),
    getDiscussionChannelRootCommentAggregate: () => ({
      data: {
        discussionChannels: state.deleted
          ? []
          : [
              {
                id: state.discussionChannelId,
                discussionId: state.id,
                channelUniqueName: TEST_CHANNEL,
                archived: false,
                answered: false,
                locked: false,
                CommentsAggregate: { count: 0 },
              },
            ],
      },
    }),
    getChannel: () => ({
      data: {
        channels: [buildChannel(TEST_CHANNEL)],
      },
    }),
    getIssue: () => ({
      data: {
        issues: [],
      },
    }),
    getDiscussionCommentIssue: () => ({
      data: {
        discussionChannels: [
          {
            id: state.discussionChannelId,
            Comments: [],
          },
        ],
      },
    }),
    getChannelDownloadCount: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            DiscussionChannelsAggregate: { count: state.deleted ? 0 : 1 },
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
            id: state.discussionChannelId,
            discussionId: state.id,
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
    getModsByChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
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
            uniqueName: TEST_CHANNEL,
            SuspendedUsers: [],
          },
        ],
      },
    }),
    userIsModInChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            Admins: [],
            SuspendedUsers: [],
            Moderators: [],
            SuspendedMods: [],
          },
        ],
      },
    }),
    updateDiscussionWithChannelConnections: ({ body }) => {
      const variables = body.variables as UpdateDiscussionVariables | undefined;
      const update = variables?.updateDiscussionInput;
      state = {
        ...state,
        title: update?.title ?? '',
        body: update?.body ?? '',
        tags:
          update?.Tags?.[0]?.connectOrCreate?.map(
            (tag) => tag.where.node.text
          ).filter((tag): tag is string => Boolean(tag)) || [],
      };
      return {
        data: {
          updateDiscussionWithChannelConnections: {
            id: state.id,
            title: state.title,
            body: state.body,
            DiscussionChannels: [
              {
                id: state.discussionChannelId,
                channelUniqueName: TEST_CHANNEL,
                discussionId: state.id,
                Channel: { uniqueName: TEST_CHANNEL },
                archived: false,
                answered: false,
                locked: false,
              },
            ],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            Tags: state.tags.map((text) => ({ text })),
          },
        },
      };
    },
    deleteDiscussion: () => {
      state = {
        ...state,
        deleted: true,
      };
      return {
        data: {
          deleteDiscussions: {
            nodesDeleted: 1,
            relationshipsDeleted: 1,
          },
        },
      };
    },
    getDiscussionsInChannel: () => buildDiscussionListResponse(state),
  });

  try {
    await page.goto('/discussions/create');
    await expect(
      page.getByText("You don't have permission to see this page")
    ).toHaveCount(0);

    await page.getByTestId('title-input').fill(TEST_DISCUSSION);
    await page.getByTestId('body-input').fill(TEST_BODY);

    const channelPicker = page.getByTestId('channel-input');
    await channelPicker.click();
    await page.getByText(TEST_CHANNEL, { exact: true }).click();
    await expect(channelPicker).toContainText(TEST_CHANNEL);
    await page.getByTestId('title-input').click();
    await expect(page.getByLabel('Type to search...')).toHaveCount(0);

    const tagPicker = page.getByTestId('tag-picker');
    await tagPicker.click();
    await page.getByText(TAG_ONE, { exact: true }).click();
    await page.getByText(TAG_TWO, { exact: true }).click();
    await expect(tagPicker).toContainText(TAG_ONE);
    await expect(tagPicker).toContainText(TAG_TWO);

    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions/${state.id}`);
    await expect(page.getByRole('heading', { name: TEST_DISCUSSION })).toBeVisible();
    await expect(page.getByText(TEST_BODY)).toBeVisible();

    await page.goto(`/forums/${TEST_CHANNEL}/discussions/edit/${state.id}`);
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions/edit/${state.id}`);

    const bodyInput = page.getByTestId('body-input');
    await expect(bodyInput).toBeVisible();
    await bodyInput.fill(UPDATED_BODY);

    await tagPicker.click();
    await page.getByText(TAG_THREE, { exact: true }).click();
    await page.getByText(TAG_ONE, { exact: true }).click();
    await expect(tagPicker).toContainText(TAG_TWO);
    await expect(tagPicker).toContainText(TAG_THREE);
    await expect(tagPicker).not.toContainText(TAG_ONE);

    await page.getByRole('button', { name: 'Save' }).first().click();
    await page.goto(`/forums/${TEST_CHANNEL}/discussions/${state.id}`);
    await expect(page.getByText(UPDATED_BODY)).toBeVisible();

    await page.getByTestId('discussion-menu-button').click();
    await page.getByTestId('discussion-menu-button-item-Delete').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions`);

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
