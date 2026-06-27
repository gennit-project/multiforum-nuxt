import { expect, test } from '../../helpers/testFixture';
import {
  buildIssue,
  buildModCommentActivityItem,
} from '../../helpers/graphqlFixtures';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { getIssueDetailBaseMocks } from '../../helpers/issueDetailMocks';

// Workflows:
//   - "Verify Suspend Mod Option in Issue Comment Context Menu"
//   - "Verify SuspendModButton in Issue Related Content Header"
//
// Both suspend-from-issue entry points are gated on `issue.relatedModProfileName`.
// That field is only populated on the client because GET_ISSUE / ISSUE_BASE_FIELDS
// selects it — so these tests also guard against regressing that query (without
// the field, no suspend UI renders and these tests fail).
//
// Setup: an open issue whose `relatedModProfileName` is "mod-bob" and whose
// activity feed contains a comment authored by "mod-bob". The current user
// (channel admin "alice") may suspend mods.

const TEST_CHANNEL = 'cats';
const TEST_USER = 'alice';
const ISSUE_NUMBER = 1;
const TARGET_MOD = 'mod-bob';
const COMMENT_TEXT = 'A moderation comment from the targeted mod.';

const buildModIssue = () =>
  buildIssue({
    issueNumber: ISSUE_NUMBER,
    channelUniqueName: TEST_CHANNEL,
    title: 'Reported moderator conduct',
    isOpen: true,
    activityFeed: [
      buildModCommentActivityItem({
        text: COMMENT_TEXT,
        modDisplayName: TARGET_MOD,
        channelUniqueName: TEST_CHANNEL,
        issueId: `issue-${ISSUE_NUMBER}`,
      }) as never,
    ],
    overrides: {
      // Issue targets a mod profile; relatedDiscussionId enables the
      // SuspendModButton's "already suspended?" lookup.
      relatedModProfileName: TARGET_MOD,
      relatedDiscussionId: 'discussion-1',
    },
  });

type SuspendModVariables = {
  issueID?: string;
  suspendUntil?: string | null;
  suspendIndefinitely?: boolean;
  explanation?: string;
};

test('suspends the targeted mod from the activity-feed Suspend Mod button', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  let suspendVariables: SuspendModVariables | null = null;

  await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: TEST_USER, channel: TEST_CHANNEL }),
    getIssue: () => ({ data: { issues: [buildModIssue()] } }),
    suspendMod: ({ body }) => {
      suspendVariables = body.variables as SuspendModVariables;
      return { data: { suspendMod: { id: 'suspension-1' } } };
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

  // Generous timeout: the issue route can pay a cold Vite-compile cost on the
  // first navigation of an isolated run.
  await expect(page.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 60_000 });

  // The activity feed renders a Suspend Mod button because the action's actor
  // matches the issue's related mod profile.
  await page.getByRole('button', { name: 'Suspend Mod' }).click();

  // The SuspendModModal opens.
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();

  // Submit with the default suspension length ("Two Weeks").
  await page.getByRole('button', { name: 'Submit' }).click();

  // Success notification confirms the suspension.
  await expect(page.getByText('The mod was suspended.')).toBeVisible();

  // The suspendMod mutation ran against this issue.
  expect(suspendVariables).toMatchObject({
    issueID: `issue-${ISSUE_NUMBER}`,
    suspendIndefinitely: false,
  });
});

test('offers Suspend Mod in the activity-feed comment context menu', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: TEST_USER, channel: TEST_CHANNEL }),
    getIssue: () => ({ data: { issues: [buildModIssue()] } }),
    suspendMod: () => ({ data: { suspendMod: { id: 'suspension-1' } } }),
  });

  await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

  // Generous timeout: the issue route can pay a cold Vite-compile cost on the
  // first navigation of an isolated run.
  await expect(page.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 60_000 });

  // Open the comment context menu; it must offer a "Suspend Mod" action because
  // the comment's author is the issue's related mod profile.
  await page.getByRole('button', { name: 'Comment actions' }).click();
  await page.getByRole('menuitem', { name: 'Suspend Mod' }).click();

  // Choosing it opens the suspend modal pre-filled with the issue context.
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
});

test('unsuspends an already-suspended mod from the activity feed', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  let unsuspendVariables: { issueId?: string; explanation?: string } | null =
    null;

  await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: TEST_USER, channel: TEST_CHANNEL }),
    getIssue: () => ({ data: { issues: [buildModIssue()] } }),
    // The targeted mod is already suspended -> button flips to "Unsuspend Mod".
    getSuspension: () => ({ data: { isOriginalPosterSuspended: true } }),
    unsuspendMod: ({ body }) => {
      unsuspendVariables = body.variables as {
        issueId?: string;
        explanation?: string;
      };
      return { data: { unsuspendMod: { id: 'suspension-1' } } };
    },
  });

  await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

  // Generous timeout: the issue route can pay a cold Vite-compile cost on the
  // first navigation of an isolated run.
  await expect(page.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 60_000 });

  // Because the mod is suspended, the activity feed offers Unsuspend (not Suspend).
  await expect(
    page.getByRole('button', { name: 'Suspend Mod', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Unsuspend Mod' }).click();

  // The UnsuspendModModal opens (it pre-fills an explanation, so Submit is enabled).
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('The mod was unsuspended.')).toBeVisible();

  expect(unsuspendVariables).toMatchObject({ issueId: `issue-${ISSUE_NUMBER}` });
});

test('does not show suspend UI when the issue has no related mod profile', async ({
  context,
  page,
}) => {
  await installMockAuth(context, page, {
    username: TEST_USER,
    email: 'alice@example.com',
  });

  // Same activity feed, but the issue does NOT target a mod profile.
  const issue = buildIssue({
    issueNumber: ISSUE_NUMBER,
    channelUniqueName: TEST_CHANNEL,
    title: 'Reported comment (not a mod issue)',
    isOpen: true,
    activityFeed: [
      buildModCommentActivityItem({
        text: COMMENT_TEXT,
        modDisplayName: TARGET_MOD,
        channelUniqueName: TEST_CHANNEL,
        issueId: `issue-${ISSUE_NUMBER}`,
      }) as never,
    ],
    overrides: { relatedDiscussionId: 'discussion-1' },
  });

  await installGraphqlMocks(page, {
    ...getIssueDetailBaseMocks({ username: TEST_USER, channel: TEST_CHANNEL }),
    getIssue: () => ({ data: { issues: [issue] } }),
  });

  await page.goto(`/forums/${TEST_CHANNEL}/issues/${ISSUE_NUMBER}`);

  // Generous timeout: the issue route can pay a cold Vite-compile cost on the
  // first navigation of an isolated run.
  await expect(page.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 60_000 });

  // No Suspend Mod button in the activity feed.
  await expect(
    page.getByRole('button', { name: 'Suspend Mod' })
  ).toHaveCount(0);

  // The context menu still offers "Report Mod Comment" but not "Suspend Mod".
  await page.getByRole('button', { name: 'Comment actions' }).click();
  await expect(
    page.getByRole('menuitem', { name: 'Report Mod Comment' })
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Suspend Mod' })
  ).toHaveCount(0);
});
