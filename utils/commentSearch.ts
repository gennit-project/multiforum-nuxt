/**
 * Pure helpers for the comment-search page: parsing the channel filter from the
 * route, building the GraphQL `where` clause, and resolving author display
 * fields off the CommentAuthor union. Extracted from comments/search.vue so the
 * regex escaping and filter logic can be unit-tested without mounting the page.
 */

export type CommentSearchWhereParams = {
  searchInput: string;
  selectedChannels: string[];
};

/** Read the `channels` query param (string or array) into a clean string list. */
export function getChannelsFromQuery(
  channels: unknown
): string[] {
  if (typeof channels === 'string') return [channels];
  if (Array.isArray(channels)) {
    return channels.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

/**
 * Build the comment-search `where` filter: always excludes feedback and
 * issue comments, adds a case-insensitive (regex-escaped) text match, and an
 * optional channel filter spanning both discussion and event comments.
 */
export function buildCommentSearchWhere(
  params: CommentSearchWhereParams
): Record<string, unknown> {
  const { searchInput, selectedChannels } = params;
  const where: Record<string, unknown> = {
    isFeedbackComment_NOT: true,
    Issue: null,
  };

  const trimmed = searchInput.trim();
  if (trimmed) {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    where.text_MATCHES = `(?i).*${escaped}.*`;
  }

  if (selectedChannels.length > 0) {
    where.OR = [
      { DiscussionChannel: { channelUniqueName_IN: selectedChannels } },
      {
        Event: {
          EventChannels_SOME: { channelUniqueName_IN: selectedChannels },
        },
      },
    ];
  }

  return where;
}

type CommentAuthorLike = {
  __typename?: string;
  username?: string | null;
  displayName?: string | null;
  profilePicURL?: string | null;
} | null;

type CommentLike = { CommentAuthor?: CommentAuthorLike } | null | undefined;

/** Username (or mod display name) shown for a comment author; 'Unknown' fallback. */
export function getCommentAuthorUsername(comment: CommentLike): string {
  const author = comment?.CommentAuthor;
  if (author?.__typename === 'User') return author.username ?? 'Unknown';
  if (author?.__typename === 'ModerationProfile') {
    return author.displayName ?? 'Unknown';
  }
  return 'Unknown';
}

/** Display name for a comment author, preferring displayName then username. */
export function getCommentAuthorDisplayName(comment: CommentLike): string {
  const author = comment?.CommentAuthor;
  if (author?.__typename === 'User') {
    return author.displayName || author.username || 'Unknown';
  }
  if (author?.__typename === 'ModerationProfile') {
    return author.displayName ?? 'Unknown';
  }
  return 'Unknown';
}

/** Profile picture URL for a User author; empty string for mods/unknown. */
export function getCommentAuthorProfilePic(comment: CommentLike): string {
  const author = comment?.CommentAuthor;
  if (author?.__typename === 'User') return author.profilePicURL ?? '';
  return '';
}
