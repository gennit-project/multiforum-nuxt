import { expect, test } from '../../helpers/testFixture';
import { buildChannel } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';

// Wiki authoring pages (create / create-child / edit). Only wiki moderation was
// previously covered; these exercise the authoring forms.
const TEST_USER = 'alice';
const TEST_CHANNEL = 'cats';

const base = () =>
  createBaseHandlers({
    username: TEST_USER,
    channelId: TEST_CHANNEL,
    channelOverrides: { wikiEnabled: true },
  });

test.describe('Wiki authoring', () => {
  test('wiki create page renders the create form', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, { ...base() });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/wiki/create`, { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Create Wiki Page' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('wiki create-child page renders the add-page form', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    // create-child shows "Add Wiki Page" only when a wiki home page already
    // exists; otherwise it prompts to create the home page first. Seed a
    // WikiHomePage on the channel (spread buildChannel to keep the shell fields).
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getChannel: () => ({
        data: {
          channels: [
            {
              ...buildChannel({
                uniqueName: TEST_CHANNEL,
                overrides: { wikiEnabled: true },
              }),
              WikiHomePage: {
                __typename: 'WikiPage',
                id: 'wiki-home',
                title: 'Home',
                slug: 'home',
                body: '',
                ChildPages: [],
              },
            },
          ],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/wiki/create-child`, { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Add Wiki Page' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('wiki edit page renders the edit form for an existing page', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page, { username: TEST_USER, email: 'alice@example.com' });
    const diagnostics = await installGraphqlMocks(page, {
      ...base(),
      getWikiPage: () => ({
        data: {
          wikiPages: [
            {
              __typename: 'WikiPage',
              title: 'Test Wiki Page',
              body: 'Body content',
              slug: 'test-page',
              VersionAuthor: null,
              ChildPages: [],
            },
          ],
        },
      }),
    });

    try {
      await page.goto(`/forums/${TEST_CHANNEL}/wiki/edit/test-page`, { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { name: 'Edit Wiki Page' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
