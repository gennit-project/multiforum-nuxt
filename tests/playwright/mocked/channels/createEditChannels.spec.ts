import { expect, test } from '@playwright/test';
import type {
  ChannelCreateInput,
  ChannelUpdateInput,
} from '@/__generated__/graphql';
import {
  MOCK_DATE,
  buildBasicUser,
  buildChannel,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

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
      buildChannel({
        uniqueName: channel.uniqueName,
        displayName: channel.displayName,
        description: channel.description,
        tags: channel.tags,
        discussionChannelsCount: 0,
      }),
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
          buildBasicUser({
            AdminOfChannelsAggregate: { count: 1 },
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
      data: {
        users: [{ username: 'cluse', Suspensions: [] }],
      },
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
        serverConfigs: [buildServerConfig({ serverName: 'Gennit' })],
      },
    }),
    getTags: () => ({
      data: {
        tags: [{ text: 'trivia' }, { text: 'general' }],
      },
    }),
    getChannelNames: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            displayName: TEST_CHANNEL,
            channelIconURL: '',
            description: '',
            eventsEnabled: true,
          },
        ],
      },
    }),
    getEvents: () => ({
      data: {
        events: [],
      },
    }),
    getModsByChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            Admins: [{ username: 'cluse' }],
            Moderators: [],
          },
        ],
      },
    }),
    userIsModInChannel: () => ({
      data: {
        channels: [
          {
            uniqueName: TEST_CHANNEL,
            Admins: [{ username: 'cluse' }],
            SuspendedUsers: [],
            Moderators: [],
            SuspendedMods: [],
          },
        ],
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
    getIssue: () => ({
      data: {
        issues: [],
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
                eventsEnabled: true,
                feedbackEnabled: true,
                imageUploadsEnabled: true,
                markdownImagesEnabled: true,
                emojiEnabled: true,
                Admins: [{ username: 'cluse' }],
                createdAt: MOCK_DATE,
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
                createdAt: MOCK_DATE,
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

    // Click Save and wait for the GraphQL response
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/graphql') && resp.request().postData()?.includes('createChannel'),
        { timeout: 30000 }
      ),
      page.getByRole('button', { name: 'Save' }).first().click(),
    ]);

    // Verify the response was successful and log details for CI debugging
    const responseJson = await response.json().catch(() => null);
    console.log('createChannel response status:', response.status());
    console.log('createChannel response data:', JSON.stringify(responseJson?.data?.createChannels?.channels?.[0]));

    // Wait for the createChannel operation to be recorded
    await waitForGraphqlOperation(diagnostics.completedOperations, 'createChannel');

    // Debug: Log all console errors and operations for CI debugging
    console.log('All completed operations:', diagnostics.completedOperations.map(op => op.operationName));
    console.log('Console errors count:', diagnostics.consoleErrors.length);
    if (diagnostics.consoleErrors.length > 0) {
      console.log('Console errors:', diagnostics.consoleErrors.slice(0, 5));
    }

    // Wait for any pending network requests to complete
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Network did not become idle within timeout');
    });

    // Log current URL for debugging
    console.log('Current URL before assertion:', page.url());

    // Wait for navigation to complete - give more time in CI
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/discussions`, { timeout: 30000 });
    await expect(
      page.getByRole('link', { name: TEST_CHANNEL, exact: true }).first()
    ).toBeVisible();

    await page.goto(`/forums/${TEST_CHANNEL}/edit/basic`);
    await expect(page).toHaveURL(`/forums/${TEST_CHANNEL}/edit/basic`);

    const descriptionInput = page.getByTestId('description-input');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill(TEST_DESCRIPTION);

    const tagPicker = page.getByTestId('tag-input');
    await tagPicker.click();
    const tagCheckbox = page.getByLabel(`Select ${TEST_TAG}`);
    await page.getByText(TEST_TAG, { exact: true }).click();
    await expect(tagCheckbox).toBeChecked();
    await expect(tagPicker).toContainText(TEST_TAG);
    await page.getByRole('button', { name: 'Save' }).first().click();
    await waitForGraphqlOperation(diagnostics.completedOperations, 'updateChannel');

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
