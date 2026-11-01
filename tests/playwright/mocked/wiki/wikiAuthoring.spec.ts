import { expect, test } from '../../helpers/testFixture';
import { buildChannel } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { makeWikiPage } from '../../../utils/wikiFixtures';
import type {
  WriteWikiPageMutation,
  WriteWikiPageMutationVariables,
  GetWikiPageQuery,
  GetSiteWideWikiListQuery,
} from '../../../../__generated__/operations';

const scenarios = [
  {
    name: 'home creation',
    route: 'create',
    slug: 'home',
    id: 'created-home',
    extra: { slug: 'home', setAsHome: true },
  },
  {
    name: 'child creation',
    route: 'create-child',
    slug: 'new-title',
    id: 'created-child',
    extra: { slug: 'new-title', parentId: 'wiki-home' },
  },
  {
    name: 'home edit',
    route: 'edit/home',
    slug: 'home',
    id: 'wiki-home',
    extra: { id: 'wiki-home' },
  },
  {
    name: 'regular edit',
    route: 'edit/intro',
    slug: 'intro',
    id: 'wiki-intro',
    extra: { id: 'wiki-intro' },
  },
];
for (const scenario of scenarios) {
  test(`submits ${scenario.name} with the typed authenticated write contract`, async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: 'alice',
      email: 'alice@example.com',
    });
    const requests: unknown[] = [];
    const result: WriteWikiPageMutation = {
      writeWikiPage: {
        id: scenario.id,
        slug: scenario.slug,
        channelUniqueName: 'cats',
        title: 'New title',
        body: 'New body',
        editReason: 'Browser edit',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
        locked: false,
        OriginalAuthor: { username: 'alice' },
        VersionAuthor: { username: 'alice' },
        PastVersions: [],
      },
    };
    const wiki: GetWikiPageQuery = {
      wikiPages: [makeWikiPage({ id: scenario.id, slug: scenario.slug })],
    };
    const list: GetSiteWideWikiListQuery = {
      getSiteWideWikiList: {
        aggregateWikiPageCount: 0,
        featuredWikiPages: [],
        wikiPages: [],
      },
    };
    await installGraphqlMocks(page, {
      ...createBaseHandlers({
        username: 'alice',
        channelId: 'cats',
        channelOverrides: { wikiEnabled: true },
      }),
      getChannel: () => ({
        data: {
          channels: [
            {
              ...buildChannel({
                uniqueName: 'cats',
                overrides: { wikiEnabled: true },
              }),
              WikiHomePage: makeWikiPage({ id: 'wiki-home', slug: 'home' }),
            },
          ],
        },
      }),
      getWikiPage: () => ({ data: wiki }),
      getSiteWideWikiList: () => ({ data: list }),
      writeWikiPage: ({ body }) => {
        requests.push(body.variables);
        return { data: result };
      },
    });
    await page.goto(`/forums/cats/wiki/${scenario.route}`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('title-input').fill('New title');
    await page.getByTestId('content-input').fill('New body');
    await page.getByTestId('edit-reason-input').fill('Browser edit');
    await page.locator('button[type="submit"]').last().click();
    const expected: WriteWikiPageMutationVariables = {
      input: {
        channelUniqueName: 'cats',
        title: 'New title',
        body: 'New body',
        editReason: 'Browser edit',
        ...scenario.extra,
      },
    };
    await expect.poll(() => requests).toEqual([expected]);
    await expect(page).toHaveURL(
      scenario.route === 'edit/intro' ? /\/wiki\/intro\?t=/ : /\/wiki\?t=/
    );
  });
}
