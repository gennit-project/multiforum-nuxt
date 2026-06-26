import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';

const TEST_USER = 'alice';
const PLUGIN_ID = 'test-plugin';

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

    const diagnostics = await installGraphqlMocks(page, getBaseMocks(TEST_USER));

    try {
      await page.goto(`/admin/settings/plugins/${PLUGIN_ID}`);

      await expect(page.getByText('Test Plugin').first()).toBeVisible();
      await expect(
        page.getByText('A plugin used for E2E coverage.')
      ).toBeVisible();

      await waitForGraphqlOperation(diagnostics.completedOperations, 'GetPlugins');
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
});
