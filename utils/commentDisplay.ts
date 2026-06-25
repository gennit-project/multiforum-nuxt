/**
 * Pure display/derivation helpers extracted from the (large) Comment.vue
 * component so the rules for reply counts, subscription/ownership checks, and
 * the feedback label can be unit-tested in isolation.
 */

type CommentAuthorLike = {
  __typename?: string;
  username?: string | null;
} | null;

type SubscriberLike = { username?: string | null };

type CommentLike = {
  ChildCommentsAggregate?: { count?: number | null } | null;
  CommentAuthor?: CommentAuthorLike;
  SubscribedToNotifications?: SubscriberLike[] | null;
  GivesFeedbackOnDiscussion?: unknown;
  GivesFeedbackOnEvent?: unknown;
  GivesFeedbackOnComment?: unknown;
  Issue?: unknown;
} | null | undefined;

/** Number of direct replies to a comment; 0 when the aggregate is missing. */
export function getCommentReplyCount(comment: CommentLike): number {
  return comment?.ChildCommentsAggregate?.count ?? 0;
}

/** Whether the given user is subscribed to notifications on the comment. */
export function isCommentSubscribedByUser(
  comment: CommentLike,
  username: string | null | undefined
): boolean {
  if (!username) return false;
  return (
    comment?.SubscribedToNotifications?.some(
      (user) => user.username === username
    ) ?? false
  );
}

/** Whether the comment was authored by the given (User) account. */
export function isCommentOwnedByUser(
  comment: CommentLike,
  username: string | null | undefined
): boolean {
  if (!username) return false;
  const author = comment?.CommentAuthor;
  return author?.__typename === 'User' && author?.username === username;
}

export type CommentFeedbackLabelParams = {
  showLabel: boolean;
  comment: CommentLike;
};

/**
 * Label shown above a comment describing what it provides feedback on. Returns
 * an empty string when labels are hidden or the comment is an ordinary reply.
 */
export function getCommentFeedbackLabel({
  showLabel,
  comment,
}: CommentFeedbackLabelParams): string {
  if (!showLabel || !comment) return '';
  if (comment.GivesFeedbackOnDiscussion) return 'Feedback on Discussion';
  if (comment.GivesFeedbackOnEvent) return 'Feedback on Event';
  if (comment.GivesFeedbackOnComment) return 'Feedback on Comment';
  if (comment.Issue) return 'Comment on Issue';
  return '';
}
