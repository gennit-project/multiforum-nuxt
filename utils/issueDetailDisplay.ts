/**
 * Pure display helpers for the moderation issue detail view. These are split
 * out of the (large) IssueDetail.vue component so the formatting and
 * data-derivation rules can be unit-tested in isolation.
 */

type IssueReportSource = {
  ActivityFeedAggregate?: { count?: number | null } | null;
} | null | undefined;

type IssueRelatedContent = {
  relatedDiscussionId?: string | null;
  relatedEventId?: string | null;
  relatedCommentId?: string | null;
  relatedWikiPageId?: string | null;
  relatedWikiRevisionId?: string | null;
} | null | undefined;

type RelatedCommentLike = {
  CommentAuthor?: {
    __typename?: string;
    isBot?: boolean | null;
  } | null;
} | null | undefined;

/**
 * Number of items in the issue's activity feed, or null when the count is
 * unavailable (e.g. the aggregate hasn't loaded yet).
 */
export function getReportCount(issue: IssueReportSource): number | null {
  const count = issue?.ActivityFeedAggregate?.count;
  return typeof count === 'number' ? count : null;
}

/**
 * Human-readable, pluralized label for a report count. Returns an empty string
 * when the count is null so the UI can hide the label.
 */
export function formatReportCountLabel(count: number | null): string {
  if (count === null) return '';
  return `${count} ${count === 1 ? 'report' : 'reports'}`;
}

/**
 * Whether the issue links to any related content (discussion, event, comment,
 * or wiki page/revision).
 */
export function hasRelatedContent(issue: IssueRelatedContent): boolean {
  return Boolean(
    issue?.relatedDiscussionId ||
      issue?.relatedEventId ||
      issue?.relatedCommentId ||
      issue?.relatedWikiPageId ||
      issue?.relatedWikiRevisionId
  );
}

/**
 * Whether the related comment was authored by a bot user. Only User authors can
 * be bots; mod-profile authors are never treated as bots.
 */
export function isRelatedCommentAuthorBot(
  relatedComment: RelatedCommentLike
): boolean {
  const commentAuthor = relatedComment?.CommentAuthor;
  if (commentAuthor && commentAuthor.__typename === 'User') {
    return commentAuthor.isBot === true;
  }
  return false;
}

/**
 * Resolve whether the original poster should be presented as a moderator or a
 * regular user. A mod profile name takes precedence; otherwise it falls back to
 * 'user' (including when neither identifier is present).
 */
export function resolveAuthorType({
  modProfileName,
  username,
}: {
  modProfileName: string;
  username: string;
}): 'mod' | 'user' {
  if (modProfileName) return 'mod';
  if (username) return 'user';
  return 'user';
}
