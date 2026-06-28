import { expect, test } from '../../helpers/testFixture';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Sitewide search / directory pages. Each renders a SearchBar with a
// page-specific placeholder; that bar is static, so the pages render their
// search UI regardless of result data.
const TEST_USER = 'alice';

const pages = [
  { path: '/forums', placeholder: 'Search forums' },
  { path: '/comments/search', placeholder: 'Search comments' },
  { path: '/wiki/search', placeholder: 'Search wiki' },
];

test.describe('Sitewide search/directory pages', () => {
  for (const p of pages) {
    test(`${p.path} renders its search bar`, async ({
      context,
      page,
    }, testInfo) => {
      await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
      const diagnostics = await installGraphqlMocks(page, {
        ...createBaseHandlers({ username: TEST_USER }),
      });

      try {
        await page.goto(p.path, { waitUntil: 'domcontentloaded' });
        await expect(page.getByPlaceholder(p.placeholder)).toBeVisible();
      } finally {
        await testInfo.attach('graphql-operations.json', {
          body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
          contentType: 'application/json',
        });
      }
    });
  }
});
