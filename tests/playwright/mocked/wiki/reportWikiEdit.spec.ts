import { test, expect } from '../../helpers/testFixture';
import { buildChannel } from '../../helpers/graphqlFixtures';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import {
  DEFAULT_MOD_ROLE,
  DEFAULT_RULES_JSON,
} from '../../helpers/moderationFixtures';

const TEST_CHANNEL = 'cats';
const SLUG = 'cat-care';
const WIKI_PAGE_ID = 'wiki-page-1';
const FORUM_RULE = 'Be kind';

type ReportWikiEditVariables = {
  wikiPageId?: string;
  wikiRevisionId?: string | null;
  selectedForumRules?: string[];
  selectedServerRules?: string[];
  reportText?: string;
  channelUniqueName?: string;
};

const buildWikiPage = () => ({
  __typename: 'WikiPage',
  id: WIKI_PAGE_ID,
  title: 'Cat Care Guide',
  slug: SLUG,
  body: 'Current version of the page.',
  editReason: 'Latest tweak',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  VersionAuthor: { username: 'carol' },
  ChildPages: [],
  PastVersions: [
    {
      id: 'rev-2',
      body: 'Second version of the page.',
      editReason: 'Clarified wording',
      createdAt: '2024-01-10T00:00:00Z',
      Author: { username: 'bob' },
    },
    {
      id: 'rev-1',
      body: 'Original version of the page.',
      editReason: null,
      createdAt: '2024-01-05T00:00:00Z',
      Author: { username: 'alice' },
    },
  ],
  Channel: { uniqueName: TEST_CHANNEL },
});

test('reports a wiki edit with the shared broken-rules modal', async ({
  page,
  setupMockedPage,
}) => {
  let reportVariables: ReportWikiEditVariables | null = null;

  const { diagnostics } = await setupMockedPage({
    username: 'alice',
    email: 'alice@example.com',
    handlers: {
      ...createBaseHandlers({
        username: 'alice',
        channelId: TEST_CHANNEL,
        isModerator: true,
        moderatorDisplayName: 'alice',
        serverConfigOverrides: {
          rules: DEFAULT_RULES_JSON,
          DefaultModRole: DEFAULT_MOD_ROLE,
          DefaultElevatedModRole: DEFAULT_MOD_ROLE,
        },
        channelOverrides: {
          rules: DEFAULT_RULES_JSON,
          DefaultModRole: DEFAULT_MOD_ROLE,
          ElevatedModRole: DEFAULT_MOD_ROLE,
        },
      }),
      getWikiPage: () => ({ data: { wikiPages: [buildWikiPage()] } }),
      getServerRules: () => ({
        data: { serverConfigs: [{ rules: DEFAULT_RULES_JSON }] },
      }),
      getChannelRules: () => ({
        data: {
          channels: [
            buildChannel({
              uniqueName: TEST_CHANNEL,
              overrides: { rules: DEFAULT_RULES_JSON },
            }),
          ],
        },
      }),
      reportWikiEdit: ({ body }) => {
        reportVariables = body.variables as ReportWikiEditVariables;
        return {
          data: { reportWikiEdit: { id: 'issue-1', issueNumber: 1 } },
        };
      },
    },
  });

  await page.goto(
    `/forums/${TEST_CHANNEL}/wiki/revisions/diff/${SLUG}/most-recent-edit`
  );

  await page.getByRole('button', { name: 'Report Edit' }).click();

  // Shared modal opens in wiki mode.
  await expect(page.getByText('Report Wiki Edit')).toBeVisible();

  // Select a forum rule and add context.
  await page
    .getByTestId('forum-rules-section')
    .getByTestId('broken-rule-checkbox')
    .first()
    .check();
  await page
    .getByTestId('report-wiki edit-input')
    .fill('This revision is vandalism.');

  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(
    page.getByText('Your report was submitted successfully.')
  ).toBeVisible();

  expect(reportVariables).toEqual({
    wikiPageId: WIKI_PAGE_ID,
    wikiRevisionId: 'rev-2',
    selectedForumRules: [FORUM_RULE],
    selectedServerRules: [],
    reportText: 'This revision is vandalism.',
    channelUniqueName: TEST_CHANNEL,
  });
  expect(diagnostics.pageErrors).toEqual([]);
});
