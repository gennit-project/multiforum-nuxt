/**
 * Shared role-badge resolution used by both the forum-scoped and server-scoped
 * badge helpers. The matching logic is identical across scopes; only the
 * returned label literals differ, so the scope-specific wrappers in
 * forumRoleBadges.ts / serverRoleBadges.ts map this generic result onto their
 * own string union.
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
 * The set of badges shown for a content author within a channel context.
 * Used uniformly across discussions, events, downloads and comments so the same
 * person reads the same way everywhere.
 *
 * - `isAdmin`   — server-wide admin (`ServerConfig.Admins`) → "Admin". Applies
 *   everywhere, in any forum.
 * - `isForumAdmin` — owner of THIS channel (`channel.Admins`) → "Forum Admin".
 *   Scoped to the channel.
 * - `isForumMod` — moderator of THIS channel who is NOT its owner → "Forum Mod".
 *   Owner implies mod, so a channel owner never also shows the Forum Mod badge.
 *
 * `isAdmin` and `isForumAdmin` can both be true (a server admin who owns the
 * forum). In a cross-forum context (no single channel) pass empty forum lists so
 * that only the server-wide Admin badge can show.
 */
export type AuthorBadges = {
  isAdmin: boolean;
  isForumAdmin: boolean;
  isForumMod: boolean;
};

export const getAuthorBadges = ({
  username,
  modProfileName,
  serverAdminUsernames = [],
  forumAdminUsernames = [],
  forumModUsernames = [],
  forumModProfileNames = [],
}: {
  username?: string | null;
  modProfileName?: string | null;
  serverAdminUsernames?: string[];
  forumAdminUsernames?: string[];
  forumModUsernames?: string[];
  forumModProfileNames?: string[];
}): AuthorBadges => {
  const isAdmin = hasMatch(username, serverAdminUsernames);
  const isForumAdmin = hasMatch(username, forumAdminUsernames);
  const isForumMod =
    !isForumAdmin &&
    (hasMatch(username, forumModUsernames) ||
      hasMatch(modProfileName, forumModProfileNames));
  return { isAdmin, isForumAdmin, isForumMod };
};
