import { expect, test } from '../../helpers/testFixture';
import { buildUser } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Forum membership / permission editors (forums/[forumId]/edit/{mods,owners,
// suspended-mods,suspended-users}) — the "who can moderate / who is suspended"
// settings. These had no E2E coverage. The /edit pages require the viewer to be
// a forum owner, so the test user is seeded into the channel's Admins.
const TEST_USER = 'alice';
const TEST_CHANNEL = 'cats';

const base = () =>
  createBaseHandlers({
    username: TEST_USER,
    channelId: TEST_CHANNEL,
    channelOverrides: { Admins: [buildUser({ username: TEST_USER })] },
  });

const channelRow = (fields: Record<string, unknown>) => ({
  data: {
    channels: [{ __typename: 'Channel', uniqueName: TEST_CHANNEL, ...fields }],
  },
});

test.describe('Forum membership editors (admin)', () => {
  test('mods editor renders the invite-a-mod form', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getPendingChannelModsByChannel: () => channelRow({ PendingModInvites: [] }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/edit/mods`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Invite a New Mod')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('owners editor renders the invite-an-admin form', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getChannelOwnersByChannel: () => channelRow({ Admins: [] }),
      getPendingChannelOwnersByChannel: () => channelRow({ PendingOwnerInvites: [] }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/edit/owners`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Invite a New Admin')).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('suspended-users editor renders the user-suspensions section', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    // The suspended-users query reuses the `getChannel` op (SuspendedUsers come
    // from the base getChannel handler), so no extra mock is needed.
    const diagnostics = await installGraphqlMocks(page, { ...base() });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/edit/suspended-users`, { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'User Suspensions' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  // NOTE: edit/suspended-mods is intentionally not covered yet. Its
  // SuspendedModList renders a "Permission Required" gate that owner +
  // moderator seeding alone doesn't satisfy — it needs a stricter permission
  // setup that warrants its own investigation. Deferred to a follow-up.
});
