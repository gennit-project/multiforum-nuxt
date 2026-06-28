import { expect, test } from '../../helpers/testFixture';
import {
  buildServerHealthDashboard,
  buildServerPermissionsConfig,
} from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Admin server-health dashboard and the server-roles management page. Both are
// admin-only, data-gated surfaces: their content only renders once the
// dashboard health query / the GET_SERVER_PERMISSIONS (op `getServerConfig`)
// query resolve with valid shapes. These tests exercise the shared
// createBaseHandlers base plus the buildServerHealthDashboard /
// buildServerPermissionsConfig fixtures added for exactly this purpose.
const TEST_USER = 'alice';

test.describe('Admin dashboard + roles', () => {
  test('server dashboard renders for an admin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      getServerHealthDashboard: () => ({
        data: { getServerHealthDashboard: buildServerHealthDashboard() },
      }),
    });

    try {
      await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Server Dashboard' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('server roles page renders the roles editor for an admin', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...createBaseHandlers({ username: TEST_USER }),
      // GET_SERVER_PERMISSIONS reuses the `getServerConfig` operation name but
      // needs the role tiers + pending invites populated.
      getServerConfig: () => ({
        data: { serverConfigs: [buildServerPermissionsConfig()] },
      }),
      // The roles page also lists channel-scoped mod roles.
      GetModChannelRoles: () => ({ data: { modChannelRoles: [] } }),
    });

    try {
      await page.goto('/admin/roles', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Server Roles' })).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
