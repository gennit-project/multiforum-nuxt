/**
 * Permission utility functions for checking user permissions in forums/channels
 */

type Role = {
  canReport?: boolean;
  canGiveFeedback?: boolean;
  canHideComment?: boolean;
  canHideDiscussion?: boolean;
  canSuspendUser?: boolean;
  canEditWiki?: boolean;
  canAddMods?: boolean;
  canRemoveMods?: boolean;
  canAddOwners?: boolean;
  canRemoveOwners?: boolean;
  canChangeSettings?: boolean;
  [key: string]: boolean | undefined;
};

type PermissionData = {
  Admins?: Array<{ username: string }>;
  Moderators?: Array<{ displayName: string }>;
  SuspendedMods?: Array<{ modProfileName: string }>;
  SuspendedUsers?: Array<{ username: string }>;
  uniqueName?: string;
  [key: string]: any;
};

/**
 * Checks if the user has permission to perform a specific action in a channel
 * 
 * @param permissionData - Data about the user's roles in the channel
 * @param standardModRole - The standard mod role for the channel/server
 * @param elevatedModRole - The elevated mod role for the channel/server
 * @param username - The user's username
 * @param modProfileName - The user's mod profile name (if they are a mod)
 * @param action - The permission action to check (e.g., 'canReport', 'canHideComment')
 * @returns boolean indicating if the user has permission
 */
export const checkPermission = (
  permissionData: PermissionData | null,
  standardModRole: Role | null,
  elevatedModRole: Role | null,
  username: string,
  modProfileName: string,
  action: string
): boolean => {
  // If we don't have permission data or role data, the user can't perform the action
  if (!permissionData || (!standardModRole && !elevatedModRole)) {
    return false;
  }

  // Check if user is a channel owner (admin) - admins can do anything
  const isChannelOwner = permissionData.Admins?.some(
    admin => admin.username === username
  ) || false;

  if (isChannelOwner) {
    return true;
  }

  // Check if the user is suspended
  const isSuspendedMod = permissionData.SuspendedMods?.some(
    mod => mod.modProfileName === modProfileName
  ) || false;

  if (isSuspendedMod) {
    return false;
  }

  // Check if the user is an elevated mod
  const isElevatedMod = permissionData.Moderators?.some(
    mod => mod.displayName === modProfileName
  ) || false;

  if (isElevatedMod) {
    // Check if the elevated mod role has the required permission
    if (elevatedModRole && elevatedModRole[action] !== undefined) {
      return !!elevatedModRole[action];
    }
  }

  // For standard mods, check if the standard mod role has the required permission
  if (standardModRole && standardModRole[action] !== undefined) {
    return !!standardModRole[action];
  }

  // If we can't determine the permission, default to false
  return false;
};

/**
 * Gets all permissions for a user in a channel
 * 
 * @param permissionData - Data about the user's roles in the channel
 * @param standardModRole - The standard mod role for the channel/server
 * @param elevatedModRole - The elevated mod role for the channel/server
 * @param username - The user's username
 * @param modProfileName - The user's mod profile name (if they are a mod)
 * @returns Object with all permissions mapped
 */
export const getAllPermissions = (
  permissionData: PermissionData | null,
  standardModRole: Role | null,
  elevatedModRole: Role | null,
  username: string,
  modProfileName: string
): Record<string, boolean> => {
  // Define all possible permissions
  const allActions = [
    'canReport',
    'canGiveFeedback',
    'canHideComment',
    'canHideDiscussion',
    'canSuspendUser',
    'canEditWiki',
    'canAddMods',
    'canRemoveMods',
    'canAddOwners',
    'canRemoveOwners',
    'canChangeSettings'
  ];

  // Create an object with all permissions
  const permissions: Record<string, boolean> = {};
  
  allActions.forEach(action => {
    permissions[action] = checkPermission(
      permissionData,
      standardModRole,
      elevatedModRole,
      username,
      modProfileName,
      action
    );
  });

  // Add role information
  permissions.isChannelOwner = permissionData?.Admins?.some(
    admin => admin.username === username
  ) || false;
  
  permissions.isElevatedMod = permissionData?.Moderators?.some(
    mod => mod.displayName === modProfileName
  ) || false;
  
  permissions.isSuspendedMod = permissionData?.SuspendedMods?.some(
    mod => mod.modProfileName === modProfileName
  ) || false;

  permissions.isSuspendedUser = permissionData?.SuspendedUsers?.some(
    user => user.username === username
  ) || false;

  return permissions;
};