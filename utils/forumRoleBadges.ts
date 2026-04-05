export type ForumRoleBadge = 'forumAdmin' | 'forumMod' | null;

type GetForumRoleBadgeParams = {
  username?: string | null;
  modProfileName?: string | null;
  adminUsernames?: string[];
  modUsernames?: string[];
  modProfileNames?: string[];
};

const hasMatch = (value: string | null | undefined, candidates: string[]) => {
  if (!value) {
    return false;
  }

  return candidates.includes(value);
};

export const getForumRoleBadge = ({
  username,
  modProfileName,
  adminUsernames = [],
  modUsernames = [],
  modProfileNames = [],
}: GetForumRoleBadgeParams): ForumRoleBadge => {
  if (hasMatch(username, adminUsernames)) {
    return 'forumAdmin';
  }

  if (
    hasMatch(username, modUsernames) ||
    hasMatch(modProfileName, modProfileNames)
  ) {
    return 'forumMod';
  }

  return null;
};
