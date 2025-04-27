/**
 * Permission utility functions for checking user permissions in forums/channels
 */
import type { ModChannelRole, ModServerRole } from "@/__generated__/graphql";

// Create a union type of all permission keys from ModChannelRole and ModServerRole
type PermissionKey = keyof Pick<
  ModChannelRole & ModServerRole,
  | 'canReport'
  | 'canGiveFeedback'
  | 'canHideComment'
  | 'canHideDiscussion'
  | 'canHideEvent'
  | 'canSuspendUser'
  | 'canOpenSupportTickets'
  | 'canCloseSupportTickets'
  | 'canLockChannel'
>;

// Role type used in the utility functions
type Role = {
  [K in PermissionKey]?: boolean;
} & {
  // Additional permissions not directly in the schema types (like channel-specific ones)
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

// Parameter types for the exported functions
export type CheckPermissionParams = {
  permissionData: PermissionData | null;
  standardModRole: Role | null;
  elevatedModRole: Role | null;
  username: string;
  modProfileName: string;
  action: PermissionKey | string;
};

export type GetAllPermissionsParams = {
  permissionData: PermissionData | null;
  standardModRole: Role | null;
  elevatedModRole: Role | null;
  username: string;
  modProfileName: string;
};

/**
 * Checks if the user has permission to perform a specific action in a channel
 * 
 * @param params - Object containing all parameters:
 *   - permissionData - Data about the user's roles in the channel
 *   - standardModRole - The standard mod role for the channel/server
 *   - elevatedModRole - The elevated mod role for the channel/server
 *   - username - The user's username
 *   - modProfileName - The user's mod profile name (if they are a mod)
 *   - action - The permission action to check, can be any of:
 *     - Core permissions from ModChannelRole and ModServerRole: 
 *       'canReport', 'canGiveFeedback', 'canHideComment', 'canHideDiscussion', 
 *       'canHideEvent', 'canSuspendUser', 'canOpenSupportTickets', 
 *       'canCloseSupportTickets', 'canLockChannel'
 *     - Additional application permissions:
 *       'canEditWiki', 'canAddMods', 'canRemoveMods', 'canAddOwners', 
 *       'canRemoveOwners', 'canChangeSettings'
 * @returns boolean indicating if the user has permission
 */
export const checkPermission = (params: CheckPermissionParams): boolean => {
  console.log("Check permission params", params);
  const {
    permissionData,
    standardModRole,
    elevatedModRole,
    username,
    modProfileName,
    action
  } = params;
  
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
 * @param params - Object containing all parameters:
 *   - permissionData - Data about the user's roles in the channel
 *   - standardModRole - The standard mod role for the channel/server
 *   - elevatedModRole - The elevated mod role for the channel/server
 *   - username - The user's username
 *   - modProfileName - The user's mod profile name (if they are a mod)
 * @returns Object with all permissions mapped:
 *   - Core permissions from schema: 'canReport', 'canGiveFeedback', etc.
 *   - Additional permissions: 'canEditWiki', 'canAddMods', etc.
 *   - Role information: 'isChannelOwner', 'isElevatedMod', 'isSuspendedMod', 'isSuspendedUser'
 */
export const getAllPermissions = (params: GetAllPermissionsParams): Record<string, boolean> => {
  if (!params) {
    return {};
  }
  const {
    permissionData,
    standardModRole,
    elevatedModRole,
    username,
    modProfileName
  } = params;
  
  // Define all possible permissions from ModChannelRole and ModServerRole
  const corePermissions: PermissionKey[] = [
    'canReport',
    'canGiveFeedback',
    'canHideComment',
    'canHideDiscussion',
    'canHideEvent',
    'canSuspendUser',
    'canOpenSupportTickets',
    'canCloseSupportTickets',
    'canLockChannel'
  ];

  // Additional permissions specific to our application
  const additionalPermissions: string[] = [
    'canEditWiki',
    'canAddMods',
    'canRemoveMods',
    'canAddOwners',
    'canRemoveOwners',
    'canChangeSettings'
  ];

  // Combine all permission types
  const allActions = [...corePermissions, ...additionalPermissions];

  // Create an object with all permissions
  const permissions: Record<string, boolean> = {};
  
  allActions.forEach(action => {
    permissions[action] = checkPermission({
      permissionData,
      standardModRole,
      elevatedModRole,
      username,
      modProfileName,
      action
    });
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