import { expect, test } from '../../helpers/testFixture';
import {
  buildComment,
  buildDiscussion,
  buildIssue,
} from '../../helpers/graphqlFixtures';
import { getIssueDetailBaseMocks } from '../../helpers/issueDetailMocks';
import { installMockAuth } from '../../helpers/mockAuth';
import { installGraphqlMocks } from '../../helpers/mockGraphql';
import { expectNoAxeViolations } from '../../helpers/axe';

for (const target of ['comment', 'discussion'] as const) {
  test(`cold-cache moderator ${target} editor waits for content and resets a cancelled draft`, async ({
    context,
    page,
  }) => {
    await installMockAuth(context, page, {
      username: 'alice',
      email: 'alice@example.com',
    });
    const discussion = buildDiscussion({
      id: 'discussion-1',
      channelUniqueName: 'cats',
      title: 'Original title',
      body: 'Original body',
    });
    const comment = buildComment({
      comment: {
        id: 'comment-1',
        text: 'Original body',
        parentCommentId: null,
      },
      comments: [],
    });
    const queryName = target === 'comment' ? 'getComment' : 'getDiscussion';
    const mutationName =
      target === 'comment' ? 'updateComment' : 'updateDiscussion';
    const editButtonName =
      target === 'comment' ? 'Edit Comment' : 'Edit title and/or body';
    const issue = buildIssue({
      issueNumber: 1,
      channelUniqueName: 'cats',
      title: 'Reported discussion',
      isOpen: true,
      overrides:
        target === 'comment'
          ? { relatedCommentId: comment.id }
          : { relatedDiscussionId: discussion.id },
    });
    const diagnostics = await installGraphqlMocks(page, {
      ...getIssueDetailBaseMocks({ username: 'alice' }),
      getIssue: () => ({ data: { issues: [issue] } }),
      getIssueRelatedDiscussion: () => ({
        data: { discussions: [discussion] },
      }),
      getDiscussion: () => ({ data: { discussions: [discussion] } }),
      getComment: () => ({ data: { comments: [comment] } }),
      updateComment: () => ({
        data: {
          updateComments: {
            comments: [{ ...comment, text: 'Moderated body' }],
          },
        },
      }),
      updateDiscussion: () => ({
        data: {
          updateDiscussions: {
            discussions: [{ ...discussion, body: 'Moderated body' }],
          },
        },
      }),
      updateIssue: () => ({ data: { updateIssues: { issues: [issue] } } }),
    });
    let releaseContent!: () => void;
    const contentReleased = new Promise<void>((resolve) => {
      releaseContent = resolve;
    });
    await page.route('**/graphql', async (route) => {
      if (route.request().postDataJSON()?.operationName === queryName)
        await contentReleased;
      await route.fallback();
    });
    try {
      await page.goto('/forums/cats/issues/1');
      await page
        .getByRole('button', { name: 'Review resolution options' })
        .click();
      await page
        .locator('#issue-resolution-options')
        .getByRole('button', { name: editButtonName, exact: true })
        .click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('status')).toHaveText('Loading content…');
      await expect(
        dialog.getByPlaceholder('Update the content...')
      ).toHaveCount(0);
      await expect(
        dialog.getByRole('button', { name: 'Save edits' })
      ).toHaveCount(0);
      // Loading has a real cancel control, and dismissal does not navigate away.
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(/\/forums\/cats\/issues\/1$/);
      await page
        .locator('#issue-resolution-options')
        .getByRole('button', { name: editButtonName, exact: true })
        .click();
      releaseContent();
      const body = dialog.getByPlaceholder('Update the content...');
      await expect(body).toHaveValue('Original body');
      if (target === 'discussion') {
        await expect(
          dialog.getByPlaceholder('Update the title...')
        ).toHaveValue('Original title');
      }
      await body.fill('Cancelled draft');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page
        .locator('#issue-resolution-options')
        .getByRole('button', { name: editButtonName, exact: true })
        .click();
      await expect(body).toHaveValue('Original body');
      await body.fill('Moderated body');
      await dialog.locator('input[value="Be kind"]').first().check();
      await dialog
        .getByPlaceholder('Briefly explain the edit for audit/history')
        .fill('Remove personal details');
      await expectNoAxeViolations(page);
      await dialog.getByRole('button', { name: 'Save edits' }).click();
      await expect(dialog).toHaveCount(0);
      expect(
        diagnostics.seenOperations.find(
          ({ operationName }) => operationName === mutationName
        )?.variables
      ).toEqual(
        target === 'comment'
          ? {
              commentWhere: { id: { eq: comment.id } },
              updateCommentInput: {
                text: { set: 'Moderated body' },
                editReason: {
                  set: expect.stringContaining('Remove personal details'),
                },
              },
            }
          : {
              where: { id: { eq: discussion.id } },
              updateDiscussionInput: {
                title: { set: 'Original title' },
                body: { set: 'Moderated body' },
                editReason: {
                  set: expect.stringContaining('Remove personal details'),
                },
              },
            }
      );
    } finally {
      releaseContent();
    }
  });
}
