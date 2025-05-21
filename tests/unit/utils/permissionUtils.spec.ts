import { describe, it, expect } from "vitest";
import { checkPermission, getAllPermissions } from "@/utils/permissionUtils";
import type { CheckPermissionParams, GetAllPermissionsParams } from "@/utils/permissionUtils";

describe("permissionUtils", () => {
  describe("checkPermission", () => {
    // Sample test data
    const standardModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: false,
      canOpenSupportTickets: true,
    };

    const elevatedModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      canHideDiscussion: true,
      canHideEvent: true,
      canSuspendUser: false,
      canOpenSupportTickets: true,
      canCloseSupportTickets: true,
    };

    it("should return fall back to server permissions if permissionData from channel is null", () => {
      const params: CheckPermissionParams = {
        permissionData: null,
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
        action: "canReport",
      };

      expect(checkPermission(params)).toBe(true);
    });

    it("should return false if both roles are null", () => {
      const params: CheckPermissionParams = {
        permissionData: {
          Admins: [{ username: "admin1" }],
          Moderators: [{ displayName: "mod2" }],
        },
        standardModRole: null,
        elevatedModRole: null,
        username: "user1",
        modProfileName: "mod1",
        action: "canReport",
      };

      expect(checkPermission(params)).toBe(false);
    });

    it("should return true if user is a channel owner (admin)", () => {
      const params: CheckPermissionParams = {
        permissionData: {
          Admins: [{ username: "admin1" }, { username: "user1" }],
          Moderators: [{ displayName: "mod2" }],
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
        action: "canSuspendUser", // Even for actions that would normally be false
      };

      expect(checkPermission(params)).toBe(true);
    });

    it("should return false if user is a suspended mod", () => {
      const params: CheckPermissionParams = {
        permissionData: {
          Admins: [{ username: "admin1" }],
          Moderators: [{ displayName: "mod2" }],
          SuspendedMods: [{ modProfileName: "mod1" }],
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
        action: "canReport", // Even for actions that would normally be true
      };

      expect(checkPermission(params)).toBe(false);
    });

    it("should check elevated mod role permissions for elevated mods", () => {
      const permissionData = {
        Admins: [{ username: "admin1" }],
        Moderators: [{ displayName: "mod1" }], // User is an elevated mod
      };

      // Permission that elevated mods have
      expect(
        checkPermission({
          permissionData,
          standardModRole,
          elevatedModRole,
          username: "user1",
          modProfileName: "mod1",
          action: "canHideComment",
        })
      ).toBe(true);

      // Permission that elevated mods don't have
      expect(
        checkPermission({
          permissionData,
          standardModRole,
          elevatedModRole,
          username: "user1",
          modProfileName: "mod1",
          action: "canSuspendUser",
        })
      ).toBe(false);
    });

    it("should check standard mod role permissions for standard users", () => {
      const permissionData = {
        Admins: [{ username: "admin1" }],
        Moderators: [{ displayName: "mod2" }], // User is not an elevated mod
      };

      // Permission that standard mods have
      expect(
        checkPermission({
          permissionData,
          standardModRole,
          elevatedModRole,
          username: "user1",
          modProfileName: "mod1",
          action: "canReport",
        })
      ).toBe(true);

      // Permission that standard mods don't have
      expect(
        checkPermission({
          permissionData,
          standardModRole,
          elevatedModRole,
          username: "user1",
          modProfileName: "mod1",
          action: "canHideComment",
        })
      ).toBe(false);
    });

    it("should default to false if permission is not found in roles", () => {
      const permissionData = {
        Admins: [{ username: "admin1" }],
        Moderators: [{ displayName: "mod2" }],
      };

      expect(
        checkPermission({
          permissionData,
          standardModRole,
          elevatedModRole,
          username: "user1",
          modProfileName: "mod1",
          action: "nonExistentPermission", // Permission not in any role
        })
      ).toBe(false);
    });
  });

  describe("getAllPermissions", () => {
    const standardModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: false,
    };

    const elevatedModRole = {
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      canHideDiscussion: true,
      canSuspendUser: false,
    };

    it("should return all permissions for a channel owner", () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: "user1" }], // User is an admin
          Moderators: [],
          SuspendedMods: [],
          SuspendedUsers: [],
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
      };

      const permissions = getAllPermissions(params);

      // Channel owners have all permissions
      expect(permissions.canReport).toBe(true);
      expect(permissions.canHideComment).toBe(true);
      expect(permissions.canSuspendUser).toBe(true); // Even ones explicitly false for elevated mods
      expect(permissions.isChannelOwner).toBe(true);
      expect(permissions.isElevatedMod).toBe(false);
      expect(permissions.isSuspendedMod).toBe(false);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it("should return all permissions for an elevated mod", () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: "admin1" }],
          Moderators: [{ displayName: "mod1" }], // User is an elevated mod
          SuspendedMods: [],
          SuspendedUsers: [],
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
      };

      const permissions = getAllPermissions(params);

      // Should have elevated mod permissions
      expect(permissions.canReport).toBe(true);
      expect(permissions.canHideComment).toBe(true);
      expect(permissions.canHideDiscussion).toBe(true);
      expect(permissions.canSuspendUser).toBe(false); // Explicitly false in role
      expect(permissions.isChannelOwner).toBe(false);
      expect(permissions.isElevatedMod).toBe(true);
      expect(permissions.isSuspendedMod).toBe(false);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it("should return all permissions for a standard user", () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: "admin1" }],
          Moderators: [{ displayName: "mod2" }], // User is not an elevated mod
          SuspendedMods: [],
          SuspendedUsers: [],
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
      };

      const permissions = getAllPermissions(params);

      // Should have standard permissions
      expect(permissions.canReport).toBe(true);
      expect(permissions.canGiveFeedback).toBe(true);
      expect(permissions.canHideComment).toBe(false); // Explicitly false in standard role
      expect(permissions.isChannelOwner).toBe(false);
      expect(permissions.isElevatedMod).toBe(false);
      expect(permissions.isSuspendedMod).toBe(false);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it("should return all permissions for a suspended mod", () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: "admin1" }],
          Moderators: [{ displayName: "mod2" }],
          SuspendedMods: [{ modProfileName: "mod1" }], // User is suspended
          SuspendedUsers: [],
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
      };

      const permissions = getAllPermissions(params);

      // Suspended mods have no permissions
      expect(permissions.canReport).toBe(false);
      expect(permissions.canHideComment).toBe(false);
      expect(permissions.isChannelOwner).toBe(false);
      expect(permissions.isElevatedMod).toBe(false);
      expect(permissions.isSuspendedMod).toBe(true);
      expect(permissions.isSuspendedUser).toBe(false);
    });

    it("should return all permissions for a suspended user", () => {
      const params: GetAllPermissionsParams = {
        permissionData: {
          Admins: [{ username: "admin1" }],
          Moderators: [{ displayName: "mod2" }],
          SuspendedMods: [],
          SuspendedUsers: [{ username: "user1" }], // User is suspended
        },
        standardModRole,
        elevatedModRole,
        username: "user1",
        modProfileName: "mod1",
      };

      const permissions = getAllPermissions(params);

      // Should still have proper permission flags
      expect(permissions.isSuspendedUser).toBe(true);
    });
  });
});
