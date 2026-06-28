import { expect, test } from '../../helpers/testFixture';
import { buildBasicUser, buildServerConfig } from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Workflow: "Verify Dedicated Image Reports Page" — drives /admin/image-reports
// through the real getImageReports query: mixed image types render with the
// right badges, the open-only filter refetches, and the View link routes to the
// correct (channel vs admin) issue page.

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
  getServerConfig: () => ({
    data: {
      serverConfigs: [
        buildServerConfig({ serverName: 'Listical', Admins: [{ username }] }),
      ],
    },
  }),
  getChannelDownloadCount: () => ({
    data: {
      channels: [{ uniqueName: 'cats', DiscussionChannelsAggregate: { count: 0 } }],
    },
  }),
});

const buildImageReport = (overrides: Record<string, unknown>) => ({
  __typename: 'Issue',
  id: 'issue-x',
  issueNumber: 1,
  title: 'Reported image',
  body: '',
  isOpen: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  channelUniqueName: null,
  relatedImageId: null,
  relatedAlbumId: null,
  relatedProfilePicUserId: null,
  relatedChannelIconName: null,
  relatedChannelBannerName: null,
  relatedChannelUniqueName: null,
  flaggedServerRuleViolation: true,
  Author: { __typename: 'User', username: 'reporter', displayName: 'reporter' },
  ActivityFeedAggregate: { count: 1 },
  ...overrides,
});

const mixedReports = [
  buildImageReport({
    id: 'issue-album',
    issueNumber: 5,
    channelUniqueName: 'cats',
    relatedImageId: 'img-1',
  }),
  buildImageReport({
    id: 'issue-pfp',
    issueNumber: 6,
    relatedProfilePicUserId: 'baduser',
  }),
  buildImageReport({
    id: 'issue-icon',
    issueNumber: 7,
    relatedChannelIconName: 'cats',
    relatedChannelUniqueName: 'cats',
  }),
];

test('renders mixed image-report types with badges and correct View routing', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getImageReports: () => ({ data: { issues: mixedReports } }),
  });

  await page.goto('/admin/image-reports', { waitUntil: 'domcontentloaded' });

  // Type badges for each image kind.
  await expect(page.getByText('Album Image').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Profile Picture').first()).toBeVisible();
  await expect(page.getByText('Channel Icon').first()).toBeVisible();

  // View routing: channel-scoped album image -> forum issue; server-scoped
  // profile picture -> admin issue.
  await expect(page.locator('a[href="/forums/cats/issues/5"]')).toBeVisible();
  await expect(page.locator('a[href="/admin/issues/6"]')).toBeVisible();
});

test('refetches when the open-only filter is toggled', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  const diagnostics = await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getImageReports: () => ({ data: { issues: mixedReports } }),
  });

  await page.goto('/admin/image-reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Album Image').first()).toBeVisible({ timeout: 60_000 });

  const before = diagnostics.seenOperations.filter(
    (o) => o.operationName === 'getImageReports'
  ).length;
  await page.getByText('Show open reports only').click();

  await expect
    .poll(() =>
      diagnostics.seenOperations.filter(
        (o) => o.operationName === 'getImageReports'
      ).length
    )
    .toBeGreaterThan(before);
});

test('shows the empty state when there are no image reports', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getBaseMocks(TEST_USER),
    getImageReports: () => ({ data: { issues: [] } }),
  });

  await page.goto('/admin/image-reports', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText(/No image reports found/i)).toBeVisible({
    timeout: 60_000,
  });
});
