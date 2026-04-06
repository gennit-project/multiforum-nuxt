export type ServerRoleBadge = 'serverAdmin' | 'serverMod' | null;

type GetServerRoleBadgeParams = {
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

export const getServerRoleBadge = ({
  username,
  modProfileName,
  adminUsernames = [],
  modUsernames = [],
  modProfileNames = [],
}: GetServerRoleBadgeParams): ServerRoleBadge => {
  if (hasMatch(username, adminUsernames)) {
    return 'serverAdmin';
  }

  if (hasMatch(username, modUsernames) || hasMatch(modProfileName, modProfileNames)) {
    return 'serverMod';
  }

  return null;
};
