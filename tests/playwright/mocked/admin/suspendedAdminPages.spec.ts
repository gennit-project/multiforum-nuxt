import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Workflow: "Review Server Suspended Users / Mods Page". Drives the full
// page -> query -> render chain for /admin/suspended-users and
// /admin/suspended-mods (the component unit tests mock the query result; this
// exercises the real Apollo query against a mocked GraphQL payload).

const TEST_USER = 'alice';

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
  // The /admin wrapper renders its NuxtPage only once getServerConfig resolves.
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({
          serverName: 'Listical',
          Admins: [{ username }],
        }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [{ uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } }],
    },
  }),
});

const userSuspension = (overrides: Record<string, unknown> = {}) => ({
  id: 'sus-1',
  username: 'baduser',
  createdAt: '2024-01-01T00:00:00.000Z',
  suspendedUntil: null,
  suspendedIndefinitely: true,
  SuspendedUser: {
    username: 'baduser',
    displayName: 'Bad User',
    profilePicURL: '',
    commentKarma: 0,
    discussionKarma: 0,
    createdAt: '2023-01-01T00:00:00.000Z',
    isBot: false,
  },
  RelatedIssue: { id: 'issue-1', issueNumber: 7 },
  ...overrides,
});

const modSuspension = (overrides: Record<string, unknown> = {}) => ({
  id: 'msus-1',
  modProfileName: 'BadMod',
  username: 'badmoduser',
  createdAt: '2024-01-01T00:00:00.000Z',
  suspendedUntil: null,
  suspendedIndefinitely: true,
  SuspendedMod: { displayName: 'BadMod' },
  RelatedIssue: { id: 'issue-2', issueNumber: 8 },
  ...overrides,
});

test('renders server-suspended users (temporary + indefinite) with issue links', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getServerSuspendedUsers: () => ({
      data: {
        serverConfigs: [
          {
            serverName: 'Listical',
            SuspendedUsersAggregate: { count: 2 },
            SuspendedUsers: [
              userSuspension(),
              userSuspension({
                id: 'sus-2',
                username: 'tempuser',
                suspendedUntil: '2999-01-01T00:00:00.000Z',
                suspendedIndefinitely: false,
                SuspendedUser: {
                  username: 'tempuser',
                  displayName: 'Temp User',
                  profilePicURL: '',
                  commentKarma: 0,
                  discussionKarma: 0,
                  createdAt: '2023-01-01T00:00:00.000Z',
                  isBot: false,
                },
                RelatedIssue: { id: 'issue-3', issueNumber: 12 },
              }),
            ],
          },
        ],
      },
    }),
  });

  await page.goto('/admin/suspended-users', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('baduser').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('tempuser').first()).toBeVisible();
  // Indefinite vs temporary rendering.
  await expect(page.getByText(/Suspended indefinitely/i).first()).toBeVisible();
  await expect(page.getByText(/Suspended until/i).first()).toBeVisible();
  // Related-issue link(s).
  await expect(page.getByRole('link', { name: /Related Issue/i }).first()).toBeVisible();
});

test('shows the empty state when there are no server-suspended users', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getServerSuspendedUsers: () => ({
      data: {
        serverConfigs: [
          { serverName: 'Listical', SuspendedUsersAggregate: { count: 0 }, SuspendedUsers: [] },
        ],
      },
    }),
  });

  await page.goto('/admin/suspended-users', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByText(/no active server-scoped user suspensions/i)
  ).toBeVisible({ timeout: 60_000 });
});

test('renders server-suspended mods with the mod name and issue link', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getServerSuspendedMods: () => ({
      data: {
        serverConfigs: [
          {
            serverName: 'Listical',
            SuspendedModsAggregate: { count: 1 },
            SuspendedMods: [modSuspension()],
          },
        ],
      },
    }),
  });

  await page.goto('/admin/suspended-mods', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('BadMod').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/Suspended indefinitely/i).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Related Issue/i }).first()
  ).toBeVisible();
});

test('shows the empty state when there are no server-suspended mods', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getServerSuspendedMods: () => ({
      data: {
        serverConfigs: [
          { serverName: 'Listical', SuspendedModsAggregate: { count: 0 }, SuspendedMods: [] },
        ],
      },
    }),
  });

  await page.goto('/admin/suspended-mods', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByText(/no active server-scoped mod suspensions/i)
  ).toBeVisible({ timeout: 60_000 });
});
