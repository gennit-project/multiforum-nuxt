import type { DiscussionChannel } from '@/__generated__/graphql';

type Submission = Pick<DiscussionChannel, 'channelUniqueName'> & {
  CommentsConnection?: Pick<
    NonNullable<DiscussionChannel['CommentsConnection']>,
    'aggregate'
  > | null;
};

/** Explicit selections win, including empty forums. Otherwise prefer a conversation. */
export const selectDiscussionForum = (
  submissions: readonly Submission[],
  requested?: unknown
): string =>
  (
    submissions.find(
      (submission) => submission.channelUniqueName === requested
    ) ||
    submissions.find(
      (submission) =>
        (submission.CommentsConnection?.aggregate?.count?.nodes ?? 0) > 0
    ) ||
    submissions[0]
  )?.channelUniqueName || '';
