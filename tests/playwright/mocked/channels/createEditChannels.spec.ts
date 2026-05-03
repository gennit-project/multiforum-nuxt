import { expect, test } from '@playwright/test';
import type {
  ChannelCreateInput,
  ChannelUpdateInput,
} from '@/__generated__/graphql';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

const TEST_CHANNEL = 'testChannel';
const TEST_DESCRIPTION = 'Test description';
const TEST_TAG = 'trivia';

type MockChannelState = {
  uniqueName: string;
  displayName: string;
  description: string;
  tags: string[];
};

type CreateChannelVariables = {
  createChannelInput?: ChannelCreateInput[];
};

type UpdateChannelVariables = {
  update?: ChannelUpdateInput;
};

const buildChannelQueryResponse = (channel: MockChannelState) => ({
  data: {
    channels: [
      {
        uniqueName: channel.uniqueName,
        displayName: channel.displayName,
        description: channel.description,
        channelIconURL: '',
        channelBannerURL: '',
        rules: '[]',
        locked: false,
        wikiEnabled: false,
        eventsEnabled: true,
        feedbackEnabled: true,
        downloadsEnabled: false,
        allowedFileTypes: [],
        WikiHomePage: null,
        Tags: channel.tags.map((text) => ({ text })),
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
        Bots: [],
        Moderators: [],
        SuspendedMods: [],
        SuspendedUsers: [],
        DiscussionChannelsAggregate: { count: 0 },
        IssuesAggregate: { count: 0 },
        EventChannelsAggregate: { count: 0 },
        DefaultModRole: null,
        ElevatedModRole: null,
        SuspendedModRole: null,
        DefaultChannelRole: {
          canCreateComment: true,
          canCreateDiscussion: true,
          canCreateEvent: true,
          canUpdateChannel: true,
          canUploadFile: true,
          canUpvoteComment: true,
          canUpvoteDiscussion: true,
          channelUniqueName: channel.uniqueName,
        },
        SuspendedRole: null,
        FilterGroups: [],
      },
    ],
  },
});

test('creates and edits a channel', async ({
  context,
  page,
}, testInfo) => {
  let channelState: MockChannelState = {
    uniqueName: TEST_CHANNEL,
    displayName: '',
    description: '',
    tags: [],
  };

  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    getBasicUserInfo: () => ({
      data: {
        users: [
          {
            username: 'cluse',
            commentKarma: 0,
            discussionKarma: 0,
            createdAt: '2024-01-01T00:00:00.000Z',
            displayName: 'cluse',
            profilePicURL: '',
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
            notifyOnSuspensionBlocks: true,
            notificationBundleInterval: 'daily',
            notificationBundleEnabled: false,
            notificationBundleContent: 'all',
            enableSensitiveContentByDefault: false,
            NotificationsAggregate: { count: 0 },
            CommentsAggregate: { count: 0 },
            DiscussionsAggregate: { count: 0 },
            DownloadsAggregate: { count: 0 },
            EventsAggregate: { count: 0 },
            ImagesAggregate: { count: 0 },
            AlbumsAggregate: { count: 0 },
            ServerRoles: [],
            AdminOfChannelsAggregate: { count: 1 },
          },
        ],
      },
    }),
    getUserActiveSuspensions: () => ({
      data: {
        users: [{ username: 'cluse', Suspensions: [] }],
      },
    }),
    getUserFavorites: () => ({
      data: {
        users: [{ username: 'cluse', FavoriteChannels: [] }],
      },
    }),
    getServerConfig: () => ({
      data: {
        serverConfigs: [
          {
            serverName: 'Gennit',
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
        tags: [{ text: 'trivia' }, { text: 'general' }],
      },
    }),
    createChannel: ({ body }) => {
      const variables = body.variables as CreateChannelVariables | undefined;
      const input = variables?.createChannelInput?.[0];

      if (!input) {
        throw new Error('Missing createChannelInput in mocked createChannel request');
      }

      channelState = {
        ...channelState,
        uniqueName: input.uniqueName,
        displayName: input.displayName ?? '',
        description: input.description ?? '',
      };
      return {
        data: {
          createChannels: {
            channels: [
              {
                uniqueName: channelState.uniqueName,
                description: channelState.description,
                channelIconURL: '',
                channelBannerURL: '',
                Admins: [{ username: 'cluse' }],
                createdAt: '2024-01-01T00:00:00.000Z',
                Tags: [],
              },
            ],
          },
        },
      };
    },
    getChannel: () => buildChannelQueryResponse(channelState),
    getChannelDownloadCount: () => ({
      data: {
        channels: [
          {
            uniqueName: channelState.uniqueName,
            DiscussionChannelsAggregate: { count: 0 },
          },
        ],
      },
    }),
    getDiscussionsInChannel: () => ({
      data: {
        getDiscussionsInChannel: {
          aggregateDiscussionChannelsCount: 0,
          discussionChannels: [],
        },
      },
    }),
    updateChannel: ({ body }) => {
      const variables = body.variables as UpdateChannelVariables | undefined;
      const update = variables?.update;
      const nextTags =
        update?.Tags?.[0]?.connectOrCreate?.map(
          (tag) => tag.where.node.text
        ).filter((tag): tag is string => Boolean(tag)) || [];

      channelState = {
        ...channelState,
        description: update?.description ?? '',
        displayName: update?.displayName ?? '',
        tags: nextTags,
      };

      return {
        data: {
          updateChannels: {
            channels: [
              {
                uniqueName: channelState.uniqueName,
                displayName: channelState.displayName,
                description: channelState.description,
                channelIconURL: '',
                channelBannerURL: '',
                wikiEnabled: false,
                downloadsEnabled: false,
                allowedFileTypes: [],
                Admins: [{ username: 'cluse' }],
                createdAt: '2024-01-01T00:00:00.000Z',
                Tags: channelState.tags.map((text) => ({ text })),
                WikiHomePage: null,
                rules: '[]',
              },
            ],
          },
        },
      };
    },
  });

  try {
    await page.goto('/forums/create');
    await expect(
      page.getByText("You don't have permission to see this page")
    ).toHaveCount(0);

    await page.getByTestId('title-input').fill(TEST_CHANNEL);
    await page.getByRole('button', { name: 'Save' }).first().click();
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions`);
    await expect(
      page.getByRole('link', { name: TEST_CHANNEL, exact: true }).first()
    ).toBeVisible();

    await page.goto(`/forums/${TEST_CHANNEL}/edit/basic`);
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/edit/basic`);

    const descriptionInput = page.getByTestId('description-input');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill(TEST_DESCRIPTION);

    const tagPicker = page.getByTestId('tag-picker');
    await tagPicker.click();
    const tagCheckbox = page.getByLabel(`Select ${TEST_TAG}`);
    await page.getByText(TEST_TAG, { exact: true }).click();
    await expect(tagCheckbox).toBeChecked();
    await expect(tagPicker).toContainText(TEST_TAG);
    await page.getByRole('button', { name: 'Save' }).first().click();

    await expect(page.getByText('Your changes have been saved.')).toBeVisible();
    await expect(descriptionInput).toHaveValue(TEST_DESCRIPTION);
    await expect(tagPicker).toContainText(TEST_TAG);

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
