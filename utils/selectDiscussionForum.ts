type Submission = {
  channelUniqueName: string;
  CommentsConnection?: {
    aggregate?: { count?: { nodes?: number | null } | null } | null;
  } | null;
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
