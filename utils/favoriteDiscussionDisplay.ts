import { safeArrayFirst } from '@/utils/ssrSafetyUtils';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';

/**
 * Pure display helpers for the favorite-discussions library page: count
 * pluralization, link building, comment-count aggregation, and author-info
 * derivation. Extracted so the logic can be unit-tested without mounting the
 * (large) page component.
 */

type FavoriteChannel = {
  channelUniqueName?: string | null;
  CommentsAggregate?: { count?: number | null } | null;
};

type FavoriteAuthor = {
  username?: string | null;
  displayName?: string | null;
  profilePicURL?: string | null;
  commentKarma?: number | null;
  discussionKarma?: number | null;
  createdAt?: string | null;
} | null | undefined;

/** "1 comment" / "3 comments" — pluralize a count with the matching noun. */
export function formatCount(
  count: number | undefined,
  singular: string,
  plural: string
): string {
  const value = count || 0;
  return `${value} ${value === 1 ? singular : plural}`;
}

/** Link to a discussion under its first forum, or '/' when none is available. */
export function getDiscussionLink(discussion: {
  id: string;
  DiscussionChannels?: FavoriteChannel[];
}): string {
  const firstChannel = safeArrayFirst(discussion.DiscussionChannels) as
    | FavoriteChannel
    | undefined;
  if (!firstChannel?.channelUniqueName) return '/';
  return `/forums/${firstChannel.channelUniqueName}/discussions/${discussion.id}`;
}

/** Link to a forum, or '/' when no channel name is given. */
export function getChannelLink(channelUniqueName: string | undefined | null): string {
  if (!channelUniqueName) return '/';
  return `/forums/${channelUniqueName}`;
}

/** Sum of comment counts across all of a discussion's forum channels. */
export function getTotalCommentCount(
  discussionChannels: FavoriteChannel[] | undefined | null
): number {
  return (discussionChannels || []).reduce(
    (total, dc) => total + (dc.CommentsAggregate?.count || 0),
    0
  );
}

export type FavoriteAuthorInfo = {
  username: string;
  displayName: string;
  profilePicURL: string;
  commentKarma: number;
  discussionKarma: number;
  createdAt: string;
  isAdmin: boolean;
};

/**
 * Normalize a discussion author into the fields the card needs, including
 * whether they hold the server-admin badge. Returns null when there is no
 * author (deleted account).
 */
export function buildFavoriteAuthorInfo(params: {
  author: FavoriteAuthor;
  adminUsernames: string[];
}): FavoriteAuthorInfo | null {
  const { author, adminUsernames } = params;
  if (!author) return null;

  const serverRoleBadge = getServerRoleBadge({
    username: author.username,
    adminUsernames,
  });

  return {
    username: author.username || '',
    displayName: author.displayName || '',
    profilePicURL: author.profilePicURL || '',
    commentKarma: author.commentKarma ?? 0,
    discussionKarma: author.discussionKarma ?? 0,
    createdAt: author.createdAt || '',
    isAdmin: serverRoleBadge === 'serverAdmin',
  };
}
