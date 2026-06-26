import { resolveRoleBadge, type RoleBadgeParams } from '@/utils/roleBadges';

export type ForumRoleBadge = 'forumAdmin' | 'forumMod' | null;

export const getForumRoleBadge = (params: RoleBadgeParams): ForumRoleBadge => {
  const kind = resolveRoleBadge(params);
  if (kind === 'admin') {
    return 'forumAdmin';
  }
  if (kind === 'mod') {
    return 'forumMod';
  }
  return null;
};
