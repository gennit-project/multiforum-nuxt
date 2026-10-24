import { expect, test } from '../../helpers/testFixture';
import {
  buildBasicUser,
  buildServerConfig,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';
import { expectNoAxeViolations } from '../../helpers/axe';

const TEST_USER = 'alice';
const PLUGIN_ID = 'test-plugin';

const forumAllowlistManifest = {
  settingsDefaults: {
    server: {
      serverRuleCheckMode: 'off',
      serverRuleForumAllowlist: [],
    },
  },
  ui: {
    forms: {
      server: [
        {
          title: 'Server rule checking',
          description:
            'Choose where server-wide rules are evaluated. Forum-specific rule checking is configured separately.',
          fields: [
            {
              type: 'select',
              key: 'serverRuleCheckMode',
              label: 'Server rule checking',
              options: [
                { label: 'Off', value: 'off' },
                { label: 'All forums', value: 'all_forums' },
                { label: 'Allowlist', value: 'allowlist' },
              ],
            },
            {
              type: 'forum-multiselect',
              key: 'serverRuleForumAllowlist',
              label: 'Forums checked against server rules',
              description:
                'Only these forums are checked against server-wide rules.',
              visibleWhen: {
                key: 'serverRuleCheckMode',
                equals: 'allowlist',
              },
            },
          ],
        },
      ],
    },
  },
};

const buildPlugin = (overrides = {}) => ({
  id: PLUGIN_ID,
  name: PLUGIN_ID,
  displayName: 'Test Plugin',
  description: 'A plugin used for E2E coverage.',
  authorName: 'Plugin Author',
  authorUrl: '',
  homepage: '',
  license: 'MIT',
  tags: [],
  Versions: [
    {
      id: 'ver-1',
      version: '1.0.0',
      repoUrl: '',
      entryPath: '',
      readmeMarkdown: '# Test Plugin\n\nReadme body.',
      manifest: '{}',
    },
  ],
  ...overrides,
});

const buildInstalledPlugin = (overrides = {}) => ({
  plugin: {
    id: PLUGIN_ID,
    name: PLUGIN_ID,
    displayName: 'Test Plugin',
    description: 'A plugin used for E2E coverage.',
    authorName: 'Plugin Author',
    authorUrl: '',
    homepage: '',
    license: 'MIT',
    tags: [],
  },
  version: '1.0.0',
  scope: 'server',
  enabled: true,
  settingsJson: '{}',
  readmeMarkdown: '# Test Plugin',
  manifest: '{}',
  hasUpdate: false,
  latestVersion: '1.0.0',
  availableVersions: ['1.0.0'],
  ...overrides,
});

const getBaseMocks = (username: string) => ({
  getBasicUserInfo: () => ({
    data: { users: [buildBasicUser({ username, displayName: username })] },
  }),
  getUser: () => ({
    data: {
      users: [
        {
          username,
          notifyOnReplyToDiscussionByDefault: true,
          notifyOnReplyToEventByDefault: true,
        },
      ],
    },
  }),
  getUserFavorites: () => ({
    data: { users: [{ username, FavoriteChannels: [], Collections: [] }] },
  }),
  GetUserFavoriteChannels: () => ({
    data: { users: [{ username, FavoriteChannels: [] }] },
  }),
  GetUserChannelCollectionsWithChannels: () => ({
    data: { users: [{ username, Collections: [] }] },
  }),
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({ serverName: 'Listical', Admins: [{ username }] }),
      ],
    },
  }),
  GetPlugins: () => ({ data: { plugins: [buildPlugin()] } }),
  GetInstalledPlugins: () => ({ data: { getInstalledPlugins: [] } }),
  GetPluginDetail: () => ({ data: { plugins: [buildPlugin()] } }),
  GetServerPluginSecrets: () => ({ data: { getServerPluginSecrets: [] } }),
  GetPluginConfigStatus: () => ({
    data: { getPluginConfigStatus: { isFullyConfigured: true, fields: [] } },
  }),
});

test.describe('Server plugin detail', () => {
  test('renders the plugin detail for an available plugin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(
      page,
      getBaseMocks(TEST_USER)
    );

    try {
      await page.goto(`/admin/settings/plugins/${PLUGIN_ID}`);

      await expect(page.getByText('Test Plugin').first()).toBeVisible();
      await expect(
        page.getByText('A plugin used for E2E coverage.')
      ).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetPlugins'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('shows installed-plugin details for an installed plugin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      GetInstalledPlugins: () => ({
        data: { getInstalledPlugins: [buildInstalledPlugin()] },
      }),
    });

    try {
      await page.goto(`/admin/settings/plugins/${PLUGIN_ID}`);

      // The header shows the installed version, which only renders when
      // the plugin is installed.
      await expect(page.getByText('Test Plugin').first()).toBeVisible();
      await expect(page.getByText(/v1\.0\.0/).first()).toBeVisible();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'GetInstalledPlugins'
      );
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('configures a server-rule forum allowlist with the forum picker', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, {
      username: TEST_USER,
      email: 'alice@example.com',
    });

    let savedSettings: unknown;
    const installedPlugin = buildInstalledPlugin({
      settingsJson: {
        serverRuleCheckMode: 'off',
        serverRuleForumAllowlist: [],
      },
      manifest: forumAllowlistManifest,
    });
    const diagnostics = await installGraphqlMocks(page, {
      ...getBaseMocks(TEST_USER),
      GetInstalledPlugins: () => ({
        data: { getInstalledPlugins: [installedPlugin] },
      }),
      getChannelNames: () => ({
        data: {
          channels: [
            {
              __typename: 'Channel',
              uniqueName: 'cats',
              displayName: 'Cats',
              channelIconURL: '',
              description: '',
              eventsEnabled: true,
            },
            {
              __typename: 'Channel',
              uniqueName: 'dogs',
              displayName: 'Dogs',
              channelIconURL: '',
              description: '',
              eventsEnabled: true,
            },
          ],
        },
      }),
      EnableServerPlugin: ({ body }) => {
        savedSettings = body.variables?.settingsJson;
        return {
          data: {
            enableServerPlugin: {
              plugin: { id: PLUGIN_ID, name: PLUGIN_ID },
              version: '1.0.0',
              scope: 'server',
              enabled: true,
              settingsJson: savedSettings,
            },
          },
        };
      },
    });

    try {
      await page.goto(`/admin/settings/plugins/${PLUGIN_ID}`);

      await expect(
        page.getByRole('button', {
          name: /forums checked against server rules/i,
        })
      ).toBeHidden();

      await page
        .getByRole('combobox', { name: 'Server rule checking' })
        .selectOption('allowlist');
      const forumPickerButton = page.getByRole('button', {
        name: /forums checked against server rules/i,
      });

      await forumPickerButton.click();
      await page.getByRole('button', { name: 'Cats (cats)' }).click();
      await page.keyboard.press('Escape');
      await expect(forumPickerButton).toHaveAttribute('aria-expanded', 'false');
      await page.getByRole('button', { name: 'Save Settings' }).click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'EnableServerPlugin'
      );
      expect(savedSettings).toMatchObject({
        serverRuleCheckMode: 'allowlist',
        serverRuleForumAllowlist: ['cats'],
      });
      await expectNoAxeViolations(page);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
