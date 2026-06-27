/**
 * Shared role-badge resolution. `resolveRoleBadge` is the generic scope-agnostic
 * matcher; serverRoleBadges.ts maps its result onto a server-scoped string union,
 * still used by server-only display contexts (profile sidebars, sitewide lists).
 * Author badges shown next to content (discussions, events, downloads, comments,
 * the mod activity feed) are resolved together by `getAuthorBadges` below.
 */

export type RoleBadgeParams = {
  username?: string | null;
  modProfileName?: string | null;
  adminUsernames?: string[];
  modUsernames?: string[];
  modProfileNames?: string[];
};

/** Generic badge kind, scope-agnostic. */
export type RoleBadgeKind = 'admin' | 'mod' | null;

const hasMatch = (value: string | null | undefined, candidates: string[]) => {
  if (!value) {
    return false;
  }

  return candidates.includes(value);
};

export const resolveRoleBadge = ({
  username,
  modProfileName,
  adminUsernames = [],
  modUsernames = [],
  modProfileNames = [],
}: RoleBadgeParams): RoleBadgeKind => {
  if (hasMatch(username, adminUsernames)) {
    return 'admin';
  }

  if (
    hasMatch(username, modUsernames) ||
    hasMatch(modProfileName, modProfileNames)
  ) {
    return 'mod';
  }

  return null;
};

/**
 * The set of badges shown for a content author. One helper drives every surface
 * (discussions, events, downloads, comments, the mod activity feed) so the same
 * person reads the same way everywhere.
 *
 * - `isServerAdmin` — server-wide admin (`ServerConfig.Admins`) → "Server Admin".
 *   Applies everywhere, in any forum and in sitewide/cross-forum lists.
 * - `isServerMod` — server-wide moderator (`ServerConfig` mod list) who is NOT a
 *   server admin → "Server Mod". Admin implies mod, so a server admin never also
 *   shows Server Mod.
 * - `isForumAdmin` — owner of THIS channel (`channel.Admins`) → "Forum Admin".
 *   Scoped to the channel.
 * - `isForumMod` — moderator of THIS channel who is NOT its owner → "Forum Mod".
 *   Owner implies mod, so a channel owner never also shows the Forum Mod badge.
 *
 * Server- and forum-scoped badges are independent: a server admin who owns the
 * forum shows both "Server Admin" and "Forum Admin". In a cross-forum context
 * (no single channel) pass empty forum lists so only the server badges can show.
 */
export type AuthorBadges = {
  isServerAdmin: boolean;
  isServerMod: boolean;
  isForumAdmin: boolean;
  isForumMod: boolean;
};

export const getAuthorBadges = ({
  username,
  modProfileName,
  serverAdminUsernames = [],
  serverModUsernames = [],
  serverModProfileNames = [],
  forumAdminUsernames = [],
  forumModUsernames = [],
  forumModProfileNames = [],
}: {
  username?: string | null;
  modProfileName?: string | null;
  serverAdminUsernames?: string[];
  serverModUsernames?: string[];
  serverModProfileNames?: string[];
  forumAdminUsernames?: string[];
  forumModUsernames?: string[];
  forumModProfileNames?: string[];
}): AuthorBadges => {
  const isServerAdmin = hasMatch(username, serverAdminUsernames);
  const isServerMod =
    !isServerAdmin &&
    (hasMatch(username, serverModUsernames) ||
      hasMatch(modProfileName, serverModProfileNames));
  const isForumAdmin = hasMatch(username, forumAdminUsernames);
  const isForumMod =
    !isForumAdmin &&
    (hasMatch(username, forumModUsernames) ||
      hasMatch(modProfileName, forumModProfileNames));
  return { isServerAdmin, isServerMod, isForumAdmin, isForumMod };
};
