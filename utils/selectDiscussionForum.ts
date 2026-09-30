import type { DiscussionChannel } from '@/__generated__/graphql';

type Submission = Pick<DiscussionChannel, 'channelUniqueName'> & {
  CommentsAggregate?: Pick<
    NonNullable<DiscussionChannel['CommentsAggregate']>,
    'count'
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
      (submission) => (submission.CommentsAggregate?.count ?? 0) > 0
    ) ||
    submissions[0]
  )?.channelUniqueName || '';
