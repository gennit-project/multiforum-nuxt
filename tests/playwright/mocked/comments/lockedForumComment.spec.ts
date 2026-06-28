import { expect, test } from '../../helpers/testFixture';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { buildChannel } from '../../helpers/graphqlFixtures';
import {
  createCommentState,
  createCommentHandlers,
  DEFAULT_COMMENT_CONFIG,
} from '../../helpers/mockedCommentHandlers';

// A locked forum freezes commenting too: the composer is replaced by a notice.
// Mirrors createComment.spec.ts but flips the channel's lock state.
test('locked forum blocks commenting on a discussion', async ({
  context,
  page,
}, testInfo) => {
  const state = createCommentState();

  await installMockAuth(context, page);
  const diagnostics = await installGraphqlMocks(page, {
    ...createCommentHandlers(state, DEFAULT_COMMENT_CONFIG),
    getChannel: () => ({
      data: {
        channels: [
          buildChannel({
            uniqueName: DEFAULT_COMMENT_CONFIG.channelId,
            displayName: DEFAULT_COMMENT_CONFIG.channelId,
            overrides: { locked: true, lockReason: 'Spam wave' },
          }),
        ],
      },
    }),
  });

  try {
    const discussionUrl = `/forums/${DEFAULT_COMMENT_CONFIG.channelId}/discussions/${DEFAULT_COMMENT_CONFIG.discussionId}`;

    await page.goto(discussionUrl);
    await expect(
      page.getByRole('heading', { name: DEFAULT_COMMENT_CONFIG.discussionTitle })
    ).toBeVisible();

    // A locked forum freezes comments (the discussion itself is not locked in
    // this fixture, so the forum lock is the only driver). The locked state is
    // surfaced by one of two banners depending on render timing: the
    // discussion-level "This forum is locked..." notice or the comment
    // section's own "This comment section is locked." — accept either so the
    // assertion is robust to that race.
    await expect(
      page.getByText(/This (forum|comment section) is locked/i).first()
    ).toBeVisible();
  } finally {
    await testInfo.attach('graphql-operations.json', {
      body: Buffer.from(JSON.stringify(diagnostics.seenOperations, null, 2)),
      contentType: 'application/json',
    });
  }
});
