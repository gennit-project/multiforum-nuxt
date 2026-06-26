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
