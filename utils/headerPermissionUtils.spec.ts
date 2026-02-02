import { describe, it, expect } from 'vitest';
import {
  getDiscussionHeaderMenuItems,
  getEventHeaderMenuItems,
  getCommentAuthorStatus,
  getCommentMenuItems,
  canPerformModActions,
  buildArchiveMenuItems,
  buildModerationSection,
} from './headerPermissionUtils';

describe('headerPermissionUtils', () => {
  // Base permissions object - all false by default (shared across tests)
  const basePermissions = {
    canReport: false,
    canGiveFeedback: false,
    canHideComment: false,
    canHideDiscussion: false,
    canHideEvent: false,
    canSuspendUser: false,
    isChannelOwner: false,
    isElevatedMod: false,
    isSuspendedMod: false,
    isSuspendedUser: false,
  };

  describe('canPerformModActions', () => {
    it('should return false for suspended mods', () => {
      const permissions = { ...basePermissions, isSuspendedMod: true, canReport: true };
      expect(canPerformModActions(permissions, 'discussion')).toBe(false);
    });

    it('should return true for channel owners', () => {
      const permissions = { ...basePermissions, isChannelOwner: true };
      expect(canPerformModActions(permissions, 'discussion')).toBe(true);
    });

    it('should return true for elevated mods', () => {
      const permissions = { ...basePermissions, isElevatedMod: true };
      expect(canPerformModActions(permissions, 'discussion')).toBe(true);
    });

    it('should return true if user can report', () => {
      const permissions = { ...basePermissions, canReport: true };
      expect(canPerformModActions(permissions, 'discussion')).toBe(true);
    });

    it('should return true if user can give feedback', () => {
      const permissions = { ...basePermissions, canGiveFeedback: true };
      expect(canPerformModActions(permissions, 'event')).toBe(true);
    });

    it('should return true for discussion if user canHideDiscussion', () => {
      const permissions = { ...basePermissions, canHideDiscussion: true };
      expect(canPerformModActions(permissions, 'discussion')).toBe(true);
    });

    it('should return true for event if user canHideEvent', () => {
      const permissions = { ...basePermissions, canHideEvent: true };
      expect(canPerformModActions(permissions, 'event')).toBe(true);
    });

    it('should return true for comment if user canHideComment', () => {
      const permissions = { ...basePermissions, canHideComment: true };
      expect(canPerformModActions(permissions, 'comment')).toBe(true);
    });

    it('should return true if user canSuspendUser for any content type', () => {
      const permissions = { ...basePermissions, canSuspendUser: true };
      expect(canPerformModActions(permissions, 'discussion')).toBe(true);
      expect(canPerformModActions(permissions, 'event')).toBe(true);
      expect(canPerformModActions(permissions, 'comment')).toBe(true);
    });

    it('should return false if no permissions and no content type', () => {
      expect(canPerformModActions(basePermissions)).toBe(false);
    });
  });

  describe('buildArchiveMenuItems', () => {
    it('should return archive option when not archived and user has permission', () => {
      const permissions = { ...basePermissions, canHideDiscussion: true };
      const items = buildArchiveMenuItems({
        isArchived: false,
        userPermissions: permissions,
        contentType: 'discussion',
        contentId: 'disc123',
      });

      expect(items).toHaveLength(1);
      expect(items[0].label).toBe('Archive');
      expect(items[0].event).toBe('handleClickArchive');
    });

    it('should return archive and suspend options when user has both permissions', () => {
      const permissions = { ...basePermissions, canHideEvent: true, canSuspendUser: true };
      const items = buildArchiveMenuItems({
        isArchived: false,
        userPermissions: permissions,
        contentType: 'event',
        contentId: 'event123',
      });

      expect(items).toHaveLength(2);
      expect(items[0].label).toBe('Archive');
      expect(items[1].label).toBe('Archive and Suspend');
    });

    it('should return unarchive option when archived and user has permission', () => {
      const permissions = { ...basePermissions, canHideComment: true };
      const items = buildArchiveMenuItems({
        isArchived: true,
        userPermissions: permissions,
        contentType: 'comment',
        contentId: '',
      });

      expect(items).toHaveLength(1);
      expect(items[0].label).toBe('Unarchive');
      expect(items[0].event).toBe('handleClickUnarchive');
    });

    it('should return empty array when user has no permissions', () => {
      const items = buildArchiveMenuItems({
        isArchived: false,
        userPermissions: basePermissions,
        contentType: 'discussion',
        contentId: 'disc123',
      });

      expect(items).toHaveLength(0);
    });

    it('should use custom event names when provided', () => {
      const permissions = { ...basePermissions, canHideDiscussion: true };
      const items = buildArchiveMenuItems({
        isArchived: false,
        userPermissions: permissions,
        contentType: 'discussion',
        contentId: 'disc123',
        archiveEvent: 'customArchive',
      });

      expect(items[0].event).toBe('customArchive');
    });
  });

  describe('buildModerationSection', () => {
    it('should return empty array when no actions provided', () => {
      const result = buildModerationSection([]);
      expect(result).toHaveLength(0);
    });

    it('should return divider followed by actions', () => {
      const modActions = [
        { label: 'Report', event: 'report', value: '' },
        { label: 'Archive', event: 'archive', value: '' },
      ];

      const result = buildModerationSection(modActions);

      expect(result).toHaveLength(3);
      expect(result[0].isDivider).toBe(true);
      expect(result[0].value).toBe('Moderation Actions');
      expect(result[1].label).toBe('Report');
      expect(result[2].label).toBe('Archive');
    });
  });

  describe('getDiscussionHeaderMenuItems', () => {
    // Common test data
    const discussionId = 'discussion123';

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

    it('should return basic menu items for unauthenticated users', () => {
      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: false,
        userPermissions: basePermissions,
        isLoggedIn: false,
        discussionId,
      });

      // Should only have view feedback option
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].event).toBe('handleViewFeedback');

      // Should not have edit/delete or moderation actions
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeUndefined();
    });

    it('should not show View Feedback when feedbackEnabled is false', () => {
      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: false,
        isArchived: false,
        userPermissions: basePermissions,
        isLoggedIn: false,
        discussionId,
        feedbackEnabled: false,
      });

      // Should have no options
      expect(menuItems.length).toBe(0);

      // Should not have view feedback
      const viewFeedbackOption = menuItems.find(
        (item) => item.event === 'handleViewFeedback'
      );
      expect(viewFeedbackOption).toBeUndefined();
    });

    it('should include edit and delete options for discussion author', () => {
      const menuItems = getDiscussionHeaderMenuItems({
        isOwnDiscussion: true,
        isArchived: false,
        userPermissions: basePermissions,
        isLoggedIn: true,
        discussionId,
      });

      // Should have 5 items: view feedback, edit, mark as sensitive content, add album, delete
      expect(menuItems.length).toBe(5);

      // Verify edit and delete options
      const editOption = menuItems.find((item) => item.event === 'handleEdit');
      const deleteOption = menuItems.find(
        (item) => item.event === 'handleDelete'
      );

      expect(editOption).toBeDefined();
      expect(deleteOption).toBeDefined();
      expect(editOption?.value).toBe(discussionId);
      expect(deleteOption?.value).toBe(discussionId);

      // Should not have moderation actions
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeUndefined();
    });

    it('should include moderation actions for elevated moderators', () => {
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
      expect(menuItems.length).toBe(5); // 1 base + divider + 3 mod actions

      // Verify mod actions divider
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeDefined();

      // Verify moderation actions presence
      const reportOption = menuItems.find(
        (item) => item.event === 'handleClickReport'
      );
      const feedbackOption = menuItems.find(
        (item) => item.event === 'handleFeedback'
      );
      const archiveOption = menuItems.find(
        (item) => item.event === 'handleClickArchive'
      );

      expect(reportOption).toBeDefined();
      expect(feedbackOption).toBeDefined();
      expect(archiveOption).toBeDefined();
    });

    it('should not include actions for suspended moderators', () => {
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
      expect(menuItems.length).toBe(1);

      // No mod actions divider
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeUndefined();
    });

    it('should include channel owner (admin) actions regardless of other permissions', () => {
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
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeDefined();

      // Expect all actions to be available to an admin
      const reportOption = menuItems.find(
        (item) => item.event === 'handleClickReport'
      );
      const feedbackOption = menuItems.find(
        (item) => item.event === 'handleFeedback'
      );
      const archiveOption = menuItems.find(
        (item) => item.event === 'handleClickArchive'
      );
      const suspendOption = menuItems.find(
        (item) => item.event === 'handleClickArchiveAndSuspend'
      );

      expect(reportOption).toBeDefined();
      expect(feedbackOption).toBeDefined();
      expect(archiveOption).toBeDefined();
      expect(suspendOption).toBeDefined();
    });

    it('should show unarchive option instead of archive for archived discussions', () => {
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
      const unarchiveOption = menuItems.find(
        (item) => item.event === 'handleClickUnarchive'
      );
      const archiveOption = menuItems.find(
        (item) => item.event === 'handleClickArchive'
      );

      expect(unarchiveOption).toBeDefined();
      expect(archiveOption).toBeUndefined(); // Archive should not be present
    });

    it('should not show mod actions for the discussion author even if they are a mod', () => {
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
      const editOption = menuItems.find((item) => item.event === 'handleEdit');
      const deleteOption = menuItems.find(
        (item) => item.event === 'handleDelete'
      );

      expect(editOption).toBeDefined();
      expect(deleteOption).toBeDefined();

      // Should not have moderation actions
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeUndefined();
    });
  });

  describe('getEventHeaderMenuItems', () => {
    // Common test data
    const eventId = 'event123';

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

    it('should return basic menu items for unauthenticated users', () => {
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
      expect(menuItems[0].event).toBe('copyLink');
      expect(menuItems[1].event).toBe('handleViewFeedback');

      // Should not have edit/delete/cancel or moderation actions
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeUndefined();
    });

    it('should not show View Feedback when feedbackEnabled is false', () => {
      const menuItems = getEventHeaderMenuItems({
        isOwnEvent: false,
        isArchived: false,
        isCanceled: false,
        userPermissions: basePermissions,
        isLoggedIn: false,
        eventId,
        feedbackEnabled: false,
      });

      // Should only have copy link option
      expect(menuItems.length).toBe(1);
      expect(menuItems[0].event).toBe('copyLink');

      // Should not have view feedback
      const viewFeedbackOption = menuItems.find(
        (item) => item.event === 'handleViewFeedback'
      );
      expect(viewFeedbackOption).toBeUndefined();
    });

    it('should include edit, delete and cancel options for event author', () => {
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
      const editOption = menuItems.find((item) => item.event === 'handleEdit');
      const deleteOption = menuItems.find(
        (item) => item.event === 'handleDelete'
      );
      const cancelOption = menuItems.find(
        (item) => item.event === 'handleCancel'
      );

      expect(editOption).toBeDefined();
      expect(deleteOption).toBeDefined();
      expect(cancelOption).toBeDefined();

      // Should not have moderation actions
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeUndefined();
    });

    it('should not include cancel option for already canceled events', () => {
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
      const cancelOption = menuItems.find(
        (item) => item.event === 'handleCancel'
      );
      expect(cancelOption).toBeUndefined();
    });

    it('should include moderation actions for elevated moderators', () => {
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
      const modActionsDivider = menuItems.find(
        (item) => item.isDivider === true
      );
      expect(modActionsDivider).toBeDefined();

      // Verify moderation actions presence
      const reportOption = menuItems.find(
        (item) => item.event === 'handleReport'
      );
      const feedbackOption = menuItems.find(
        (item) => item.event === 'handleFeedback'
      );
      const archiveOption = menuItems.find(
        (item) => item.event === 'handleClickArchive'
      );

      expect(reportOption).toBeDefined();
      expect(feedbackOption).toBeDefined();
      expect(archiveOption).toBeDefined();
    });

    it('should not include give feedback option when on feedback page', () => {
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
      const feedbackOption = menuItems.find(
        (item) => item.event === 'handleFeedback'
      );
      expect(feedbackOption).toBeUndefined();

      // Should not include the base view feedback option either
      const viewFeedbackOption = menuItems.find(
        (item) => item.event === 'handleViewFeedback'
      );
      expect(viewFeedbackOption).toBeUndefined();
    });

    it('should show unarchive option instead of archive for archived events', () => {
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
      const unarchiveOption = menuItems.find(
        (item) => item.event === 'handleClickUnarchive'
      );
      const archiveOption = menuItems.find(
        (item) => item.event === 'handleClickArchive'
      );

      expect(unarchiveOption).toBeDefined();
      expect(archiveOption).toBeUndefined(); // Archive should not be present
    });
  });

  describe('getCommentAuthorStatus', () => {
    it('should return false for both isAdmin and isMod if author is null', () => {
      const result = getCommentAuthorStatus({ author: null });

      expect(result.isAdmin).toBe(false);
      expect(result.isMod).toBe(false);
    });

    it('should return false for both isAdmin and isMod if author is not a User', () => {
      const author = {
        __typename: 'ModerationProfile',
        username: 'mod1',
      };

      const result = getCommentAuthorStatus({ author });

      expect(result.isAdmin).toBe(false);
      expect(result.isMod).toBe(false);
    });

    it('should return correct admin status when user has ServerRoles', () => {
      const adminAuthor = {
        __typename: 'User',
        username: 'admin1',
        ServerRoles: [{ showAdminTag: true }],
        ChannelRoles: [],
      };

      const nonAdminAuthor = {
        __typename: 'User',
        username: 'user1',
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

    it('should return correct mod status when user has ChannelRoles', () => {
      const modAuthor = {
        __typename: 'User',
        username: 'mod1',
        ServerRoles: [],
        ChannelRoles: [{ showModTag: true }],
      };

      const nonModAuthor = {
        __typename: 'User',
        username: 'user1',
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

    it('should handle user with both admin and mod status', () => {
      const adminModAuthor = {
        __typename: 'User',
        username: 'adminmod1',
        ServerRoles: [{ showAdminTag: true }],
        ChannelRoles: [{ showModTag: true }],
      };

      const result = getCommentAuthorStatus({ author: adminModAuthor });

      expect(result.isAdmin).toBe(true);
      expect(result.isMod).toBe(true);
    });

    it('should handle empty roles arrays', () => {
      const authorWithEmptyRoles = {
        __typename: 'User',
        username: 'user1',
        ServerRoles: [],
        ChannelRoles: [],
      };

      const result = getCommentAuthorStatus({ author: authorWithEmptyRoles });

      expect(result.isAdmin).toBe(false);
      expect(result.isMod).toBe(false);
    });
  });

  describe('getCommentMenuItems', () => {
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

    const defaultParams = {
      isOwnComment: false,
      isArchived: false,
      isDiscussionAuthor: false,
      isMarkedAsAnswer: false,
      depth: 1,
      discussionId: 'discussion123',
      userPermissions: basePermissions,
      isLoggedIn: false,
      enableFeedback: true,
      canShowPermalink: true,
      hasPermalinkObject: true,
      hasFeedbackComments: false,
    };

    describe('for unauthenticated users', () => {
      it('should return 2 menu items', () => {
        const menuItems = getCommentMenuItems(defaultParams);

        expect(menuItems.length).toBe(2);
      });

      it('should have copyLink as first option', () => {
        const menuItems = getCommentMenuItems(defaultParams);

        expect(menuItems[0].event).toBe('copyLink');
      });

      it('should have handleViewFeedback as second option', () => {
        const menuItems = getCommentMenuItems(defaultParams);

        expect(menuItems[1].event).toBe('handleViewFeedback');
      });
    });

    describe('when canShowPermalink is false', () => {
      it('should not include Copy Link option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          canShowPermalink: false,
          hasPermalinkObject: false,
        });

        expect(menuItems.find((item) => item.event === 'copyLink')).toBeUndefined();
      });
    });

    describe('when enableFeedback is false', () => {
      it('should not include View Feedback option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          enableFeedback: false,
        });

        expect(menuItems.find((item) => item.event === 'handleViewFeedback')).toBeUndefined();
      });
    });

    describe('for comment author', () => {
      it('should include edit option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isOwnComment: true,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleEdit')).toBeDefined();
      });

      it('should include delete option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isOwnComment: true,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleDelete')).toBeDefined();
      });
    });

    describe('for discussion author on root comments', () => {
      it('should show Mark as Best Answer option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isDiscussionAuthor: true,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleMarkAsBestAnswer')).toBeDefined();
      });

      it('should show Undo Mark when comment is already marked', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isDiscussionAuthor: true,
          isMarkedAsAnswer: true,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleUnmarkAsBestAnswer')).toBeDefined();
      });

      it('should not show Mark as Best Answer for nested comments', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isDiscussionAuthor: true,
          depth: 2,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleMarkAsBestAnswer')).toBeUndefined();
      });
    });

    describe('for elevated moderators', () => {
      const elevatedModPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canReport: true,
        canGiveFeedback: true,
        canHideComment: true,
      };

      it('should include mod actions divider', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: elevatedModPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.isDivider === true)).toBeDefined();
      });

      it('should include report option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: elevatedModPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'clickReport')).toBeDefined();
      });

      it('should include give feedback option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: elevatedModPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'clickFeedback')).toBeDefined();
      });

      it('should include archive option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: elevatedModPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleClickArchive')).toBeDefined();
      });
    });

    describe('for suspended moderators', () => {
      it('should not include mod actions divider', () => {
        const suspendedModPermissions = {
          ...basePermissions,
          isElevatedMod: true,
          isSuspendedMod: true,
          canReport: true,
        };

        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: suspendedModPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.isDivider === true)).toBeUndefined();
      });
    });

    describe('for archived comments', () => {
      it('should show unarchive option', () => {
        const modPermissions = {
          ...basePermissions,
          isElevatedMod: true,
          canHideComment: true,
        };

        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isArchived: true,
          userPermissions: modPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleClickUnarchive')).toBeDefined();
      });

      it('should not show archive option', () => {
        const modPermissions = {
          ...basePermissions,
          isElevatedMod: true,
          canHideComment: true,
        };

        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isArchived: true,
          userPermissions: modPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleClickArchive')).toBeUndefined();
      });
    });

    describe('for comments with feedback', () => {
      it('should show undo feedback option', () => {
        const modPermissions = {
          ...basePermissions,
          isElevatedMod: true,
          canGiveFeedback: true,
        };

        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: modPermissions,
          isLoggedIn: true,
          hasFeedbackComments: true,
        });

        expect(menuItems.find((item) => item.event === 'clickUndoFeedback')).toBeDefined();
      });

      it('should show edit feedback option', () => {
        const modPermissions = {
          ...basePermissions,
          isElevatedMod: true,
          canGiveFeedback: true,
        };

        const menuItems = getCommentMenuItems({
          ...defaultParams,
          userPermissions: modPermissions,
          isLoggedIn: true,
          hasFeedbackComments: true,
        });

        expect(menuItems.find((item) => item.event === 'clickEditFeedback')).toBeDefined();
      });
    });

    describe('for comment author who is also a mod', () => {
      const modPermissions = {
        ...basePermissions,
        isElevatedMod: true,
        canReport: true,
        canGiveFeedback: true,
        canHideComment: true,
      };

      it('should show edit option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isOwnComment: true,
          userPermissions: modPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleEdit')).toBeDefined();
      });

      it('should show delete option', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isOwnComment: true,
          userPermissions: modPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.event === 'handleDelete')).toBeDefined();
      });

      it('should not show mod actions divider', () => {
        const menuItems = getCommentMenuItems({
          ...defaultParams,
          isOwnComment: true,
          userPermissions: modPermissions,
          isLoggedIn: true,
        });

        expect(menuItems.find((item) => item.isDivider === true)).toBeUndefined();
      });
    });
  });
});
