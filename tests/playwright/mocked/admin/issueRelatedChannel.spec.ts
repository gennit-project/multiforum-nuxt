import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import {
  installGraphqlMocks,
  waitForGraphqlOperation,
} from '../../helpers/mockGraphql';
import { createBaseHandlers } from '../../helpers/baseHandlers';
import { DEFAULT_MOD_ROLE } from '../../helpers/moderationFixtures';

// The "Related Channel" section on a server-scoped issue
// (`/admin/issues/[issueNumber]`): it shows the reported channel's lock state
// and offers Lock / Unlock for server mods. The default user `cluse` is a
// server admin, which grants canLockChannel.

const ISSUE_URL = '/admin/issues/1';
const RELATED_CHANNEL = 'cats';
const MOCK_DATE = '2024-01-01T00:00:00.000Z';

const issueHandler = () => ({
  data: {
    issues: [
      {
        __typename: 'Issue',
        id: 'issue-1',
        issueNumber: 1,
        title: 'Reported channel: cats',
        body: 'Server rule violation',
        channelUniqueName: null, // server-scoped
        relatedChannelUniqueName: RELATED_CHANNEL,
        relatedDiscussionId: '',
        relatedEventId: '',
        relatedCommentId: '',
        isOpen: true,
        locked: false,
        lockedAt: null,
        lockReason: null,
        LockedBy: null,
        flaggedServerRuleViolation: true,
        SubscribedToNotifications: [],
        ActivityFeed: [],
        ActivityFeedAggregate: { count: 1 },
        Author: { __typename: 'User', username: 'reporter1' },
      },
    ],
  },
});

const channelResponse = (locked: boolean) => ({
  uniqueName: RELATED_CHANNEL,
  displayName: RELATED_CHANNEL,
  locked,
  lockedAt: locked ? MOCK_DATE : null,
  lockReason: locked ? 'Spam wave' : null,
  LockedBy: locked ? { displayName: 'cluse' } : null,
});

const handlersFor = (channelLocked: boolean) => ({
  ...createBaseHandlers({
    channelId: RELATED_CHANNEL,
    channelOverrides: { locked: channelLocked, lockReason: 'Spam wave' },
    // canLockChannel via the role (not the racy username->Admins check), so the
    // Lock/Unlock controls render deterministically under parallel load.
    serverConfigOverrides: {
      DefaultModRole: { ...DEFAULT_MOD_ROLE, canLockChannel: true },
    },
  }),
  getIssue: issueHandler,
  // Issue-tab count badges in the admin layout.
  countIssuesByServer: () => ({ data: { issuesAggregate: { count: 1 } } }),
  countClosedIssuesByServer: () => ({
    data: { issuesAggregate: { count: 0 } },
  }),
  lockChannel: () => ({ data: { lockChannel: channelResponse(true) } }),
  unlockChannel: () => ({ data: { unlockChannel: channelResponse(false) } }),
});

test.describe('Issue detail – Related Channel', () => {
  test('shows the related channel with an Active badge and a Lock action', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, handlersFor(false));

    try {
      await page.goto(ISSUE_URL);

      await expect(page.getByText('Related Channel:')).toBeVisible();
      await expect(
        page.getByRole('link', { name: RELATED_CHANNEL })
      ).toBeVisible();
      await expect(page.getByText('Active', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Lock Channel' })
      ).toBeVisible();
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('locking from the Related Channel section fires lockChannel', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, handlersFor(false));

    try {
      await page.goto(ISSUE_URL);

      await page.getByRole('button', { name: 'Lock Channel' }).click();
      await page.locator('#lock-reason').fill('Coordinated spam');
      await page.getByTestId('lock-channel-dialog-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'lockChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'lockChannel'
      );
      expect(op?.variables?.channelUniqueName).toBe(RELATED_CHANNEL);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });

  test('a locked related channel shows the Locked badge and an Unlock action that fires unlockChannel', async ({
    context,
    page,
  }, testInfo) => {
    await installMockAuth(context, page);
    const diagnostics = await installGraphqlMocks(page, handlersFor(true));

    try {
      await page.goto(ISSUE_URL);

      await expect(page.getByText('Locked', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Unlock Channel' }).click();
      await page.getByTestId('unlock-channel-dialog-primary-button').click();

      await waitForGraphqlOperation(
        diagnostics.completedOperations,
        'unlockChannel'
      );
      const op = diagnostics.completedOperations.find(
        (o) => o.operationName === 'unlockChannel'
      );
      expect(op?.variables?.channelUniqueName).toBe(RELATED_CHANNEL);
    } finally {
      await testInfo.attach('graphql-operations.json', {
        body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
        contentType: 'application/json',
      });
    }
  });
});
