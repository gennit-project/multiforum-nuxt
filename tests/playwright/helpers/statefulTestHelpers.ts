import { expect, type Page } from '@playwright/test';

export type OpenDiscussionParams = {
  page: Page;
  channelUrl: string;
  discussionTitle: string;
};

/**
 * Navigates to a channel's discussion list and opens a specific discussion.
 */
export const openSeededDiscussion = async ({
  page,
  channelUrl,
  discussionTitle,
}: OpenDiscussionParams): Promise<void> => {
  await page.goto(channelUrl, { waitUntil: 'networkidle' });
  const discussionLink = page.getByRole('link', { name: discussionTitle });
  await expect(discussionLink).toBeVisible({ timeout: 30_000 });
  await discussionLink.click();
  await page.waitForLoadState('networkidle');
};

export type CreateCommentParams = {
  page: Page;
  text: string;
};

/**
 * Creates a new root-level comment on the current discussion.
 */
export const createComment = async ({
  page,
  text,
}: CreateCommentParams): Promise<void> => {
  const addComment = page.getByTestId('addComment');
  await expect(addComment).toBeVisible({ timeout: 10_000 });
  await addComment.click();
  await page.getByTestId('texteditor-textarea').fill(text);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
};

export type ReplyToCommentParams = {
  page: Page;
  parentCommentText: string;
  replyText: string;
};

/**
 * Replies to an existing comment identified by its text content.
 */
export const replyToComment = async ({
  page,
  parentCommentText,
  replyText,
}: ReplyToCommentParams): Promise<void> => {
  const comment = page
    .getByTestId('comment')
    .filter({ hasText: parentCommentText })
    .first();
  await expect(comment).toBeVisible();
  await comment.getByTestId('reply-comment-button').click();
  await page.getByTestId('texteditor-textarea').fill(replyText);
  await page.getByRole('button', { name: 'Save' }).first().click();
  await expect(page.getByText(replyText, { exact: true })).toBeVisible();
};

/**
 * Waits for a GraphQL response. Use this instead of arbitrary timeouts.
 */
export const waitForGraphQL = async (page: Page): Promise<void> => {
  await page.waitForResponse(
    (response) =>
      response.url().includes('/graphql') && response.status() === 200
  );
};
