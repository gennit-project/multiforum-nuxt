import { describe, it, expect } from "vitest";
import {
  getDiscussionHeaderMenuItems,
  getEventHeaderMenuItems,
  getCommentAuthorStatus,
} from "@/utils/headerPermissionUtils";

describe("headerPermissionUtils", () => {
  describe("getDiscussionHeaderMenuItems", () => {
    // Common test data
    const discussionId = "discussion123";

    // Base permissions object - all false by default
    const basePermissions = {
      canReport: false,
      canGiveFeedback: false,
      canHideComment: false,
      canHideDiscussion: false,
      canHideEvent: false,
      canSuspendUser: false,
      canOpenSupportTickets: false,
      canCloseSupportTickets: false,
      canLockChannel: false,
      canEditWiki: false,
      canAddMods: false,
      canRemoveMods: false,
      canAddOwners: false,
      canRemoveOwners: false,
      canChangeSettings: false,
      isChannelOwner: false,
      isElevatedMod: false,
      isSuspendedMod: false,
      isSuspendedUser: false,
    };

    it("should return basic menu items for unauthenticated users", () => {
      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: false,
        userPermissions: basePermissions,
        isLoggedIn: false,
        discussionId,
      });

      // Should only have view feedback and copy link options
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].event).toBe("handleViewFeedback");
      expect(menuItems[1].event).toBe("copyLink");

      // Should not have edit/delete or moderation actions
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeUndefined();
    });

    it("should include edit and delete options for discussion author", () => {
      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: true,
        isArchived: false,
        userPermissions: basePermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Should have 4 items: view feedback, copy link, edit, delete, and
      // add/edit album.
      expect(menuItems.length).toBe(5);

      // Verify edit and delete options
      const editOption = menuItems.find((item) => item.event === "handleEdit");
      const deleteOption = menuItems.find((item) => item.event === "handleDelete");

      expect(editOption).toBeDefined();
      expect(deleteOption).toBeDefined();
      expect(editOption?.value).toBe(discussionId);
      expect(deleteOption?.value).toBe(discussionId);

      // Should not have moderation actions
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeUndefined();
    });

    it("should include moderation actions for elevated moderators", () => {
      // Create elevated mod permissions
      const elevatedModPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canReport: true,
        canGiveFeedback: true,
        canHideDiscussion: true,
      };

      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: false,
        userPermissions: elevatedModPermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Should have base items plus mod actions divider and mod actions
      expect(menuItems.length).toBe(6); // 2 base + divider + 3 mod actions

      // Verify mod actions divider
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeDefined();

      // Verify moderation actions presence
      const reportOption = menuItems.find((item) => item.event === "handleClickReport");
      const feedbackOption = menuItems.find((item) => item.event === "handleFeedback");
      const archiveOption = menuItems.find((item) => item.event === "handleClickArchive");

      expect(reportOption).toBeDefined();
      expect(feedbackOption).toBeDefined();
      expect(archiveOption).toBeDefined();
    });

    it("should not include actions for suspended moderators", () => {
      // Create suspended mod permissions
      const suspendedModPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        isSuspendedMod: true,
        canReport: true, // These would normally be true but suspended mods can't use them
        canGiveFeedback: true,
        canHideDiscussion: true,
      };

      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: false,
        userPermissions: suspendedModPermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Should only have base items, no mod actions
      expect(menuItems.length).toBe(2);

      // No mod actions divider
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeUndefined();
    });

    it("should include channel owner (admin) actions regardless of other permissions", () => {
      // Create channel owner permissions with the required permissions set to true
      // In the actual implementation, channel owners still need the specific permissions
      const channelOwnerPermissions = {
        ...basePermissions,
        isChannelOwner: true,
        canReport: true,
        canGiveFeedback: true,
        canHideDiscussion: true,
        canSuspendUser: true,
      };

      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: false,
        userPermissions: channelOwnerPermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Verify mod actions divider
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeDefined();

      // Expect all actions to be available to an admin
      const reportOption = menuItems.find((item) => item.event === "handleClickReport");
      const feedbackOption = menuItems.find((item) => item.event === "handleFeedback");
      const archiveOption = menuItems.find((item) => item.event === "handleClickArchive");
      const suspendOption = menuItems.find((item) => item.event === "handleClickArchiveAndSuspend");

      expect(reportOption).toBeDefined();
      expect(feedbackOption).toBeDefined();
      expect(archiveOption).toBeDefined();
      expect(suspendOption).toBeDefined();
    });

    it("should show unarchive option instead of archive for archived discussions", () => {
      // Create mod with permissions to archive/unarchive
      const modPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canHideDiscussion: true,
      };

      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: true, // Discussion is archived
        userPermissions: modPermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Check for unarchive option
      const unarchiveOption = menuItems.find((item) => item.event === "handleClickUnarchive");
      const archiveOption = menuItems.find((item) => item.event === "handleClickArchive");

      expect(unarchiveOption).toBeDefined();
      expect(archiveOption).toBeUndefined(); // Archive should not be present
    });

    it("should not show mod actions for the discussion author even if they are a mod", () => {
      // Create mod permissions
      const modPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canReport: true,
        canGiveFeedback: true,
        canHideDiscussion: true,
      };

      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: true, // User is the author
        isArchived: false,
        userPermissions: modPermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Should have base items plus edit/delete, but no mod actions
      expect(menuItems.length).toBe(5);

      // Should have edit and delete options
      const editOption = menuItems.find((item) => item.event === "handleEdit");
      const deleteOption = menuItems.find((item) => item.event === "handleDelete");

      expect(editOption).toBeDefined();
      expect(deleteOption).toBeDefined();

      // Should not have moderation actions
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeUndefined();
    });
  });

  describe("getEventHeaderMenuItems", () => {
    // Common test data
    const eventId = "event123";

    // Base permissions object - all false by default
    const basePermissions = {
      canReport: false,
      canGiveFeedback: false,
      canHideComment: false,
      canHideDiscussion: false,
      canHideEvent: false,
      canSuspendUser: false,
      canOpenSupportTickets: false,
      canCloseSupportTickets: false,
      canLockChannel: false,
      canEditWiki: false,
      canAddMods: false,
      canRemoveMods: false,
      canAddOwners: false,
      canRemoveOwners: false,
      canChangeSettings: false,
      isChannelOwner: false,
      isElevatedMod: false,
      isSuspendedMod: false,
      isSuspendedUser: false,
    };

    it("should return basic menu items for unauthenticated users", () => {
      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: false,
        isArchived: false,
        isCanceled: false,
        userPermissions: basePermissions,
        isLoggedIn: false,
        eventId,
      });

      // Should only have copy link and view feedback options
      expect(menuItems.length).toBe(2);
      expect(menuItems[0].event).toBe("copyLink");
      expect(menuItems[1].event).toBe("handleViewFeedback");

      // Should not have edit/delete/cancel or moderation actions
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeUndefined();
    });

    it("should include edit, delete and cancel options for event author", () => {
      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: true,
        isArchived: false,
        isCanceled: false,
        userPermissions: basePermissions,
        isLoggedIn: true,
        eventId,
      });

      // Should have 5 items: copy link, view feedback, edit, delete, cancel
      expect(menuItems.length).toBe(5);

      // Verify edit, delete, and cancel options
      const editOption = menuItems.find((item) => item.event === "handleEdit");
      const deleteOption = menuItems.find((item) => item.event === "handleDelete");
      const cancelOption = menuItems.find((item) => item.event === "handleCancel");

      expect(editOption).toBeDefined();
      expect(deleteOption).toBeDefined();
      expect(cancelOption).toBeDefined();

      // Should not have moderation actions
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeUndefined();
    });

    it("should not include cancel option for already canceled events", () => {
      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: true,
        isArchived: false,
        isCanceled: true, // Event is already canceled
        userPermissions: basePermissions,
        isLoggedIn: true,
        eventId,
      });

      // Should have 4 items: copy link, view feedback, edit, delete
      expect(menuItems.length).toBe(4);

      // Cancel option should not be present
      const cancelOption = menuItems.find((item) => item.event === "handleCancel");
      expect(cancelOption).toBeUndefined();
    });

    it("should include moderation actions for elevated moderators", () => {
      // Create elevated mod permissions
      const elevatedModPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canReport: true,
        canGiveFeedback: true,
        canHideEvent: true,
      };

      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: false,
        isArchived: false,
        isCanceled: false,
        userPermissions: elevatedModPermissions,
        isLoggedIn: true,
        eventId,
      });

      // Should have base items plus mod actions divider and mod actions
      expect(menuItems.length).toBe(6); // 2 base + divider + 3 mod actions

      // Verify mod actions divider
      const modActionsDivider = menuItems.find((item) => item.isDivider === true);
      expect(modActionsDivider).toBeDefined();

      // Verify moderation actions presence
      const reportOption = menuItems.find((item) => item.event === "handleReport");
      const feedbackOption = menuItems.find((item) => item.event === "handleFeedback");
      const archiveOption = menuItems.find((item) => item.event === "handleClickArchive");

      expect(reportOption).toBeDefined();
      expect(feedbackOption).toBeDefined();
      expect(archiveOption).toBeDefined();
    });

    it("should not include give feedback option when on feedback page", () => {
      // Create elevated mod permissions
      const elevatedModPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canReport: true,
        canGiveFeedback: true,
        canHideEvent: true,
      };

      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: false,
        isArchived: false,
        isCanceled: false,
        userPermissions: elevatedModPermissions,
        isLoggedIn: true,
        eventId,
        isOnFeedbackPage: true, // On the feedback page
      });

      // Should not include the view feedback or give feedback options
      const feedbackOption = menuItems.find((item) => item.event === "handleFeedback");
      expect(feedbackOption).toBeUndefined();

      // Should not include the base view feedback option either
      const viewFeedbackOption = menuItems.find((item) => item.event === "handleViewFeedback");
      expect(viewFeedbackOption).toBeUndefined();
    });

    it("should show unarchive option instead of archive for archived events", () => {
      // Create mod with permissions to archive/unarchive
      const modPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canHideEvent: true,
      };

      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: false,
        isArchived: true, // Event is archived
        isCanceled: false,
        userPermissions: modPermissions,
        isLoggedIn: true,
        eventId,
      });

      // Check for unarchive option
      const unarchiveOption = menuItems.find((item) => item.event === "handleClickUnarchive");
      const archiveOption = menuItems.find((item) => item.event === "handleClickArchive");

      expect(unarchiveOption).toBeDefined();
      expect(archiveOption).toBeUndefined(); // Archive should not be present
    });
  });

  describe("getCommentAuthorStatus", () => {
    it("should return false for both isAdmin and isMod if author is null", () => {
      const result = getCommentAuthorStatus({ author: null });

      expect(result.isAdmin).toBe(false);
      expect(result.isMod).toBe(false);
    });

    it("should return false for both isAdmin and isMod if author is not a User", () => {
      const author = {
        __typename: "ModerationProfile",
        username: "mod1",
      };

      const result = getCommentAuthorStatus({ author });

      expect(result.isAdmin).toBe(false);
      expect(result.isMod).toBe(false);
    });

    it("should return correct admin status when user has ServerRoles", () => {
      const adminAuthor = {
        __typename: "User",
        username: "admin1",
        ServerRoles: [{ showAdminTag: true }],
        ChannelRoles: [],
      };

      const nonAdminAuthor = {
        __typename: "User",
        username: "user1",
        ServerRoles: [{ showAdminTag: false }],
        ChannelRoles: [],
      };

      const adminResult = getCommentAuthorStatus({ author: adminAuthor });
      const nonAdminResult = getCommentAuthorStatus({ author: nonAdminAuthor });

      expect(adminResult.isAdmin).toBe(true);
      expect(adminResult.isMod).toBe(false);

      expect(nonAdminResult.isAdmin).toBe(false);
      expect(nonAdminResult.isMod).toBe(false);
    });

    it("should return correct mod status when user has ChannelRoles", () => {
      const modAuthor = {
        __typename: "User",
        username: "mod1",
        ServerRoles: [],
        ChannelRoles: [{ showModTag: true }],
      };

      const nonModAuthor = {
        __typename: "User",
        username: "user1",
        ServerRoles: [],
        ChannelRoles: [{ showModTag: false }],
      };

      const modResult = getCommentAuthorStatus({ author: modAuthor });
      const nonModResult = getCommentAuthorStatus({ author: nonModAuthor });

      expect(modResult.isAdmin).toBe(false);
      expect(modResult.isMod).toBe(true);

      expect(nonModResult.isAdmin).toBe(false);
      expect(nonModResult.isMod).toBe(false);
    });

    it("should handle user with both admin and mod status", () => {
      const adminModAuthor = {
        __typename: "User",
        username: "adminmod1",
        ServerRoles: [{ showAdminTag: true }],
        ChannelRoles: [{ showModTag: true }],
      };

      const result = getCommentAuthorStatus({ author: adminModAuthor });

      expect(result.isAdmin).toBe(true);
      expect(result.isMod).toBe(true);
    });

    it("should handle empty roles arrays", () => {
      const authorWithEmptyRoles = {
        __typename: "User",
        username: "user1",
        ServerRoles: [],
        ChannelRoles: [],
      };

      const result = getCommentAuthorStatus({ author: authorWithEmptyRoles });

      expect(result.isAdmin).toBe(false);
      expect(result.isMod).toBe(false);
    });
  });
});
