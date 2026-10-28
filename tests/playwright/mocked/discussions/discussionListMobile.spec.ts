import { expect, test } from '../../helpers/testFixture';
import type { Locator, Page } from '@playwright/test';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  buildDiscussion,
  buildDiscussionChannel,
  buildUser,
} from '../../helpers/graphqlFixtures';
import { expectNoAxeViolations } from '../../helpers/axe';

const titles = [
  'A little progress on the garden this weekend',
  'How do you make room for creative projects when your energy is unpredictable?',
  'Share what you are working on this week',
  'A photo from the garden',
  'A sensitive discussion',
  'AnUnbrokenTitleThatMustStillWrapWithoutLosingAnyInformationAtTheNarrowestMobileWidth',
];
const longName = 'A very long display name that should remain fully visible';
const longUsername =
  'an_unusually_long_username_that_must_wrap_instead_of_disappearing';
const imageURL = '/mobile-list-fixture.svg';

const buildRows = () =>
  titles.map((title, i) => ({
    ...buildDiscussion({
      id: `mobile-${i}`,
      title,
      body:
        i === 3
          ? `![Garden](${imageURL})\n\nGarden preview body.`
          : i === 4
            ? `![Garden](${imageURL})\n\nPreview body for the discussion.`
            : 'Preview body for the discussion.',
      overrides: {
        createdAt: new Date(Date.now() - 86_400_000).toISOString(),
        hasSensitiveContent: i === 4,
        ...(i === 5
          ? {
              Author: buildUser({
                username: longUsername,
                displayName: longName,
              }),
            }
          : {}),
      },
    }),
    isFavorited: false,
    DiscussionChannels: (i === 5
      ? [
          'a-very-long-forum-name-that-must-remain-readable',
          'cats',
          'creative-work',
          'community',
          'fifth-forum',
        ]
      : ['cats', 'creative-work', 'community'].slice(
          0,
          i === 1 || i === 2 ? 3 : 1
        )
    ).map((channelUniqueName, j) => ({
      ...buildDiscussionChannel({
        id: `mobile-dc-${i}-${j}`,
        discussionId: `mobile-${i}`,
        channelUniqueName,
        commentsCount: [12, 4, 0, 123456, 1][j],
      }),
      Flairs:
        i === 1 || (i === 5 && j === 0)
          ? [
              {
                __typename: 'DiscussionFlair',
                id: `flair-${i}-${j}`,
                channelUniqueName,
                displayName:
                  i === 5
                    ? 'AnUnbrokenFlairNameThatMustRemainFullyReadableOnANarrowMobileScreen'
                    : 'Discussion',
                color: '#8b5cf6',
                order: 0,
                archived: false,
              },
            ]
          : [],
    })),
  }));

async function expectContained(locator: Locator, width: number) {
  const overflowing = await locator.evaluateAll(
    (elements, viewportWidth) =>
      elements
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return (
            rect.width &&
            rect.height &&
            (rect.left < -1 || rect.right > viewportWidth + 1)
          );
        })
        .map((el) => ({
          text: el.textContent,
          rect: el.getBoundingClientRect().toJSON(),
        })),
    width
  );
  expect(overflowing).toEqual([]);
}

async function screenshot(page: Page, path: string) {
  // Nuxt's development toggle is unrelated to the application UI.
  await page.evaluate(() => {
    (
      window as Window & { __ACCENTED_DISABLE__?: () => void }
    ).__ACCENTED_DISABLE__?.();
  });
  await page.addStyleTag({
    content: 'nuxt-devtools-frame,nuxt-devtools-toggle{display:none!important}',
  });
  await page.screenshot({ path, fullPage: true });
}

test.describe('Compact sitewide discussion list', () => {
  test.beforeEach(async ({ page, setupMockedPage }) => {
    await page.route('**/mobile-list-fixture.svg', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#245b38"/><circle cx="60" cy="60" r="28" fill="#ffb83e"/></svg>',
      })
    );
    const rows = buildRows();
    const base = createBaseHandlers();
    let saved = false;
    await setupMockedPage({
      handlers: {
        ...base,
        getServerConfig: () => ({
          data: {
            serverConfigs: base
              .getServerConfig()
              .data.serverConfigs.map((server) => ({
                ...server,
                featuredWikiPageIds: [],
                PendingAdminInvites: [],
                PendingModInvites: [],
              })),
          },
        }),
        getBasicUserInfo: () => ({
          data: {
            getUserWikiEditsCount: 0,
            users: base.getBasicUserInfo().data.users.map((user) => ({
              ...user,
              AuthoredWikiPageVersionsConnection: {
                aggregate: { count: { nodes: 0 } },
              },
            })),
          },
        }),
        getSiteWideDiscussionList: () => ({
          data: {
            getSiteWideDiscussionList: {
              aggregateDiscussionCount: rows.length,
              pageInfo: { endCursor: null, hasNextPage: false },
              discussions: rows,
            },
          },
        }),
        getChannelNames: () => ({ data: { channels: [] } }),
        getSitewideTagCounts: () => ({ data: { tags: [] } }),
        addFavoriteDiscussion: () => {
          saved = true;
          return {
            data: {
              updateUsers: {
                users: [
                  {
                    __typename: 'User',
                    username: 'cluse',
                    FavoriteDiscussions: [{ id: 'mobile-0', title: titles[0] }],
                  },
                ],
              },
            },
          };
        },
        GetUserCollectionsDiscussions: () => ({
          data: {
            users: [
              {
                __typename: 'User',
                username: 'cluse',
                Collections: [],
                FavoriteDiscussions: saved
                  ? [{ id: 'mobile-0', title: titles[0] }]
                  : [],
              },
            ],
          },
        }),
        CheckDiscussionInCollections: () => ({
          data: {
            users: [{ __typename: 'User', username: 'cluse', Collections: [] }],
          },
        }),
      },
    });
  });

  for (const width of [320, 390, 430]) {
    for (const dark of [false, true]) {
      test(`${width}px ${dark ? 'dark' : 'light'} preserves full content and usable controls`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/discussions');
        const list = page.getByTestId('sitewide-discussion-list');
        await expect(list.locator(':scope > li')).toHaveCount(titles.length);
        await page.evaluate(
          (dark) => document.documentElement.classList.toggle('dark', dark),
          dark
        );
        await expectContained(
          list.locator(
            'a:visible,button:visible,[data-testid="discussion-flair"], [data-testid="discussion-flair"] span'
          ),
          width
        );
        const rows = list.locator(':scope > li');
        await expect(rows.nth(5)).toContainText(longName);
        await expect(rows.nth(5)).toContainText(longUsername);
        const longForum = rows
          .nth(5)
          .getByText('a-very-long-forum-name-that-must-remain-readable', {
            exact: true,
          })
          .filter({ visible: true });
        expect(
          await longForum.evaluate((el) => ({
            whiteSpace: getComputedStyle(el).whiteSpace,
            textOverflow: getComputedStyle(el).textOverflow,
            fits: el.scrollWidth <= el.clientWidth + 1,
          }))
        ).toEqual({ whiteSpace: 'normal', textOverflow: 'clip', fits: true });
        await expect(rows.nth(1).getByTestId('discussion-flair')).toHaveCount(
          3
        );
        await expect(
          rows.nth(2).getByRole('link', { name: 'community: 0 comments' })
        ).toBeVisible();
        await expect(
          rows.nth(3).locator('img[alt="A photo from the garden"]:visible')
        ).toHaveCount(1);
        await expect(
          rows
            .nth(4)
            .getByText('Sensitive', { exact: true })
            .filter({ visible: true })
        ).toBeVisible();
        await expect(
          rows.nth(0).getByText('Server Admin', { exact: true })
        ).toBeVisible();
        const buttons = list.locator('.discussion-actions button:visible');
        const undersized = await buttons.evaluateAll((es) =>
          es
            .map((e) => e.getBoundingClientRect())
            .filter((r) => r.width < 44 || r.height < 44)
            .map((r) => r.toJSON())
        );
        expect(undersized).toEqual([]);
        // Baseline measured with these same first three fixtures at origin/main.
        const limits =
          width === 320 ? [163.25, 360.5, 227.25] : [141.25, 287.875, 205.25];
        for (let i = 0; i < 3; i++)
          expect((await rows.nth(i).boundingBox())!.height).toBeLessThan(
            limits[i]!
          );
        await screenshot(
          page,
          testInfo.outputPath(
            `discussion-list-${width}-${dark ? 'dark' : 'light'}.png`
          )
        );
        await testInfo.attach('layout', {
          path: testInfo.outputPath(
            `discussion-list-${width}-${dark ? 'dark' : 'light'}.png`
          ),
          contentType: 'image/png',
        });
      });
    }
  }

  test('repeated preview, sensitive reveal, forum expansion and collection flows', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/discussions');
    const list = page.getByTestId('sitewide-discussion-list');
    const rows = list.locator(':scope > li');
    await expect(rows).toHaveCount(titles.length);
    for (let i = 0; i < 3; i++) {
      await rows
        .nth(0)
        .getByRole('button', { name: 'Expand', exact: true })
        .click();
      await expect(
        rows
          .nth(0)
          .getByText('Preview body for the discussion.', { exact: true })
      ).toBeVisible();
      await rows
        .nth(0)
        .getByRole('button', { name: 'Collapse', exact: true })
        .click();
      await expect(
        rows
          .nth(0)
          .getByText('Preview body for the discussion.', { exact: true })
      ).toHaveCount(0);
      await rows
        .nth(5)
        .getByRole('button', { name: 'Show all 5 forums' })
        .click();
      await expect(
        rows
          .nth(5)
          .getByRole('link', { name: 'fifth-forum: 1 comment', exact: true })
      ).toBeVisible();
      await rows
        .nth(5)
        .getByRole('button', { name: 'Show fewer forums' })
        .click();
    }
    await expect(
      rows.nth(4).locator('img[alt="A sensitive discussion"]')
    ).toHaveCount(0);
    await rows
      .nth(4)
      .getByRole('button', { name: 'Expand', exact: true })
      .click();
    await expect(
      rows
        .nth(4)
        .getByText('This content has been marked as potentially sensitive.')
    ).toBeVisible();
    await rows
      .nth(4)
      .getByRole('button', { name: 'Reveal sensitive content' })
      .click();
    await expect(
      rows.nth(4).getByText('Preview body for the discussion.', { exact: true })
    ).toBeVisible();
    await expect(
      rows.nth(4).locator('img[alt="A sensitive discussion"]:visible')
    ).toHaveCount(1);
    const save = rows.nth(0).getByRole('button', {
      name: `Add "${titles[0]}" to favorites`,
      exact: true,
    });
    await expect(save.locator('svg')).toHaveClass(/lucide-bookmark/);
    await save.click();
    await expect(
      page.getByRole('button', { name: 'Organize', exact: true })
    ).toBeVisible();
    const manage = rows.nth(0).getByRole('button', {
      name: `Manage "${titles[0]}" favorites and collections`,
      exact: true,
    });
    await expect(manage).toBeEnabled();
    for (let i = 0; i < 3; i++) {
      await manage.click();
      const dialog = page.getByRole('dialog', { name: 'Add to List' });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole('textbox', { name: 'Search lists' })
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    }
    await expectNoAxeViolations(page);
  });

  test('desktop dimensions and selection links remain unchanged; zoom reflows', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/discussions');
    const list = page.getByTestId('sitewide-discussion-list');
    const rows = list.locator(':scope > li');
    await expect(rows).toHaveCount(titles.length);
    for (const [i, height] of [98.625, 151.25, 98.625].entries())
      expect((await rows.nth(i).boundingBox())!.height).toBeCloseTo(height, 0);
    await expect(
      rows.nth(0).getByRole('link', { name: titles[0], exact: true })
    ).toHaveAttribute('href', /selectedDiscussionId=mobile-0/);
    await screenshot(page, testInfo.outputPath('discussion-list-desktop.png'));
    await testInfo.attach('desktop', {
      path: testInfo.outputPath('discussion-list-desktop.png'),
      contentType: 'image/png',
    });
    // 200% browser-zoom equivalent: halve the CSS viewport and double text
    // separately to exercise both responsive reflow and enlarged type.
    await page.setViewportSize({ width: 720, height: 500 });
    await page.evaluate(
      () => (document.documentElement.style.fontSize = '200%')
    );
    await expectContained(
      list.locator(
        'a:visible,button:visible,[data-testid="discussion-flair"], [data-testid="discussion-flair"] span'
      ),
      720
    );
    await expectNoAxeViolations(page);
  });
});
