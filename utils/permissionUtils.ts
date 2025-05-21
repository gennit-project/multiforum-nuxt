/**
 * Permission utility functions for checking user and moderator permissions in forums/channels
 *
 * The application has two separate permission systems:
 * 1. User Permissions - Control what regular users can do (create content, upvote, etc.)
 * 2. Moderator Permissions - Control what moderators can do (archive content, give feedback, etc.)
 *
 * Both systems follow similar patterns but have different roles and permissions.
 */
import type { ModChannelRole, ModServerRole } from "@/__generated__/graphql";

// Create a union type of all permission keys from ModChannelRole and ModServerRole
type ModPermissionKey = keyof Pick<
  ModChannelRole & ModServerRole,
  | "canReport"
  | "canGiveFeedback"
  | "canHideComment"
  | "canHideDiscussion"
  | "canHideEvent"
  | "canSuspendUser"
  | "canOpenSupportTickets"
  | "canCloseSupportTickets"
  | "canLockChannel"
>;

// User permission keys
type UserPermissionKey =
  | "canCreateComment"
  | "canCreateDiscussion"
  | "canCreateEvent"
  | "canUpdateChannel"
  | "canUploadFile"
  | "canUpvoteComment"
  | "canUpvoteDiscussion";

// Combined permission keys type
type PermissionKey = ModPermissionKey | UserPermissionKey | string;

// Role type used in the utility functions
type Role = {
  [K in PermissionKey]?: boolean;
} & {
  // Additional permissions not directly in the schema types
  canEditWiki?: boolean;
  canAddMods?: boolean;
  canRemoveMods?: boolean;
  canAddOwners?: boolean;
  canRemoveOwners?: boolean;
  canChangeSettings?: boolean;
  [key: string]: boolean | undefined;
};

// Channel data containing role assignments
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
  action: PermissionKey;
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
 * This follows the server-side permission checking logic:
 * 1. Check if the user is a channel admin/owner (grants all permissions)
 * 2. Check for suspension status (denies most permissions)
 * 3. Check for elevated mod status and permissions
 * 4. Fall back to standard mod role permissions
 *
 * @param params - Object containing all parameters:
 *   - permissionData - Data about the user's roles in the channel
 *   - standardModRole - The standard mod role for the channel/server
 *   - elevatedModRole - The elevated mod role for the channel/server
 *   - username - The user's username
 *   - modProfileName - The user's mod profile name (if they are a mod)
 *   - action - The permission action to check
 * @returns boolean indicating if the user has permission
 */
export const checkPermission = (params: CheckPermissionParams): boolean => {
  const { permissionData, standardModRole, elevatedModRole, username, modProfileName, action } =
    params;

  // ---------- STEP 1: Initial checks ----------

  // If we have no roles defined at all, we can't check permissions
  if (!standardModRole && !elevatedModRole) {
    return false;
  }

  // If we have permission data, use it for role determination
  if (permissionData) {
    // ---------- STEP 2: Check if user is a channel owner/admin ----------
    // Channel owners/admins bypass all permission checks and can do anything
    const isChannelOwner =
      permissionData.Admins?.some((admin) => admin.username === username) || false;

    if (isChannelOwner) {
      return true;
    }

    // ---------- STEP 3: Check suspension status ----------
    // Check if the user is a suspended moderator
    const isSuspendedMod =
      permissionData.SuspendedMods?.some((mod) => mod.modProfileName === modProfileName) || false;

    // Suspended mods generally can't perform moderation actions
    if (isSuspendedMod) {
      return false;
    }

    // Check if user is suspended in this channel
    const isSuspendedUser =
      permissionData.SuspendedUsers?.some((user) => user.username === username) || false;

    if (isSuspendedUser) {
      // Suspended users can't perform most actions
      // This would need to be expanded if we have a SuspendedRole
      return false;
    }

    // ---------- STEP 4: Check if user is an elevated mod ----------
    const isElevatedMod =
      permissionData.Moderators?.some((mod) => mod.displayName === modProfileName) || false;

    // If the user is an elevated mod, use elevated mod role permissions
    if (isElevatedMod && elevatedModRole && elevatedModRole[action] !== undefined) {
      return !!elevatedModRole[action];
    }
  }
  // ---------- STEP 5: Standard mod permissions fallback ----------
  // For standard mods or when no specific role applies, use standard mod role
  if (standardModRole && standardModRole[action] !== undefined) {
    return !!standardModRole[action];
  }

  // ---------- STEP 6: Default fallback ----------
  // If we can't determine the permission, default to false for security
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
  const { permissionData, standardModRole, elevatedModRole, username, modProfileName } = params;

  // Define all possible permissions from ModChannelRole and ModServerRole
  const corePermissions: PermissionKey[] = [
    "canReport",
    "canGiveFeedback",
    "canHideComment",
    "canHideDiscussion",
    "canHideEvent",
    "canSuspendUser",
    "canOpenSupportTickets",
    "canCloseSupportTickets",
    "canLockChannel",
  ];

  // Additional permissions specific to our application
  const additionalPermissions: string[] = [
    "canEditWiki",
    "canAddMods",
    "canRemoveMods",
    "canAddOwners",
    "canRemoveOwners",
    "canChangeSettings",
  ];

  // Combine all permission types
  const allActions = [...corePermissions, ...additionalPermissions];

  // Create an object with all permissions
  const permissions: Record<string, boolean> = {};

  allActions.forEach((action) => {
    permissions[action] = checkPermission({
      permissionData,
      standardModRole,
      elevatedModRole,
      username,
      modProfileName,
      action,
    });
  });

  // Add role information
  permissions.isChannelOwner =
    permissionData?.Admins?.some((admin) => admin.username === username) || false;

  permissions.isElevatedMod =
    permissionData?.Moderators?.some((mod) => mod.displayName === modProfileName) || false;

  permissions.isSuspendedMod =
    permissionData?.SuspendedMods?.some((mod) => mod.modProfileName === modProfileName) || false;

  permissions.isSuspendedUser =
    permissionData?.SuspendedUsers?.some((user) => user.username === username) || false;

  return permissions;
};
