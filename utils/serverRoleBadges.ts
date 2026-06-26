import { resolveRoleBadge, type RoleBadgeParams } from '@/utils/roleBadges';

export type ServerRoleBadge = 'serverAdmin' | 'serverMod' | null;

export const getServerRoleBadge = (params: RoleBadgeParams): ServerRoleBadge => {
  const kind = resolveRoleBadge(params);
  if (kind === 'admin') {
    return 'serverAdmin';
  }
  if (kind === 'mod') {
    return 'serverMod';
  }
  return null;
};
