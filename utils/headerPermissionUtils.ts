/**
 * Permission utility functions specific to header components (Discussion, Event, Comment)
 * This file extracts the permission-based logic for determining what actions should be
 * available to users in the various header components.
 */

import type { MenuItem } from '@/types/GenericFormTypes';
import { ALLOWED_ICONS } from '@/utils';
import type { User, ModerationProfile } from '@/__generated__/graphql';
import type { RouteLocationRaw } from 'vue-router';

// Type for comment author with role information
type AuthorWithRoles =
  | (Pick<User, '__typename'> & {
      ServerRoles?: Array<{ showAdminTag?: boolean | null }>;
      ChannelRoles?: Array<{ showModTag?: boolean | null }>;
    })
  | Pick<ModerationProfile, '__typename'>;

/**
 * Determines which actions should be available in the discussion header menu
 * based on user permissions and the discussion state
 *
 * @param params - Parameters to determine which menu items to show:
 *   - isOwnDiscussion - Whether the current user is the author of the discussion
 *   - isArchived - Whether the discussion is archived
 *   - userPermissions - Object with all user permissions from getAllPermissions utility
 *   - isLoggedIn - Whether the user is logged in
 *   - discussionId - ID of the discussion
 * @returns Array of menu items to display
 */
export const getDiscussionHeaderMenuItems = (params: {
  isOwnDiscussion: boolean;
  isArchived: boolean;
  userPermissions: Record<string, boolean>;
  isLoggedIn: boolean;
  discussionId: string;
  hasAlbum?: boolean;
  feedbackEnabled?: boolean;
  hasSensitiveContent?: boolean;
  relatedIssueLink?: RouteLocationRaw | null;
}): MenuItem<string | RouteLocationRaw>[] => {
  const {
    isOwnDiscussion,
    isArchived,
    userPermissions,
    isLoggedIn,
    discussionId,
    hasAlbum = false,
    feedbackEnabled = true,
    hasSensitiveContent = false,
    relatedIssueLink = null,
  } = params;
  let menuItems: MenuItem<string | RouteLocationRaw>[] = [];

  if (relatedIssueLink) {
    menuItems.push({
      label: 'View Issue',
      value: relatedIssueLink,
      icon: ALLOWED_ICONS.VIEW_ISSUE,
    });
  }

  // Only add "View Feedback" if feedback is enabled on the channel
  if (feedbackEnabled) {
    menuItems.push({
      label: 'View Feedback',
      event: 'handleViewFeedback',
      icon: ALLOWED_ICONS.VIEW_FEEDBACK,
      value: discussionId,
    });
  }

  // Return early if user is not logged in
  if (!isLoggedIn) {
    return menuItems;
  }

  // If user is the author of the discussion
  if (isOwnDiscussion) {
    menuItems.push({
      label: 'Edit',
      event: 'handleEdit',
      icon: ALLOWED_ICONS.EDIT,
      value: discussionId,
    });

    // Add sensitive content toggle
    menuItems.push({
      label: hasSensitiveContent
        ? 'Mark as non-sensitive content'
        : 'Mark as sensitive content',
      event: 'handleToggleSensitiveContent',
      icon: ALLOWED_ICONS.MARK_SENSITIVE,
      value: discussionId,
    });

    // Add "Add album" action if the discussion doesn't have an album
    if (!hasAlbum) {
      menuItems.push({
        label: 'Add Album',
        event: 'handleAddAlbum',
        icon: ALLOWED_ICONS.ADD_ALBUM,
      });
    }
    menuItems.push({
      label: 'Delete',
      event: 'handleDelete',
      icon: ALLOWED_ICONS.DELETE,
      value: discussionId,
    });
  }

  // Check if the user has any moderation permission (standard mod or above)
  // Standard mods are neither elevated nor suspended, but should still see Report and Give Feedback options
  const canPerformModActions =
    !userPermissions.isSuspendedMod &&
    (userPermissions.isChannelOwner ||
      userPermissions.isElevatedMod ||
      userPermissions.canReport ||
      userPermissions.canGiveFeedback ||
      userPermissions.canHideEvent ||
      userPermissions.canSuspendUser);

  // Show mod actions if user has any mod permissions and isn't the discussion creator
  if (isLoggedIn && canPerformModActions && !isOwnDiscussion) {
    // Create a list for mod actions
    const modActions: MenuItem[] = [];

    // Add report action if user has permission
    if (userPermissions.canReport) {
      modActions.push({
        label: 'Report',
        event: 'handleClickReport',
        icon: ALLOWED_ICONS.REPORT,
        value: discussionId,
      });
    }

    // Add feedback action if user has permission
    if (userPermissions.canGiveFeedback) {
      modActions.push({
        label: 'Give Feedback',
        event: 'handleFeedback',
        icon: ALLOWED_ICONS.GIVE_FEEDBACK,
        value: discussionId,
      });
    }

    // Add archive/unarchive actions based on current state and permissions
    if (!isArchived) {
      if (userPermissions.canHideDiscussion) {
        modActions.push({
          label: 'Archive',
          event: 'handleClickArchive',
          icon: ALLOWED_ICONS.ARCHIVE,
          value: discussionId,
        });
      }

      if (userPermissions.canSuspendUser) {
        modActions.push({
          label: 'Archive and Suspend',
          event: 'handleClickArchiveAndSuspend',
          icon: ALLOWED_ICONS.SUSPEND,
          value: discussionId,
        });
      }
    } else {
      if (userPermissions.canHideDiscussion) {
        modActions.push({
          label: 'Unarchive',
          event: 'handleClickUnarchive',
          icon: ALLOWED_ICONS.UNARCHIVE,
          value: discussionId,
        });
      }
    }

    // Only add the mod actions section if there are actually actions to show
    if (modActions.length > 0) {
      menuItems.push({
        value: 'Moderation Actions',
        isDivider: true,
      });
      menuItems = menuItems.concat(modActions);
    }
  }

  return menuItems;
};

/**
 * Determines which actions should be available in the event header menu
 * based on user permissions and the event state
 *
 * @param params - Parameters to determine which menu items to show:
 *   - isOwnEvent - Whether the current user is the author of the event
 *   - isArchived - Whether the event is archived
 *   - isCanceled - Whether the event is canceled
 *   - userPermissions - Object with all user permissions from getAllPermissions utility
 *   - isLoggedIn - Whether the user is logged in
 *   - eventId - ID of the event
 *   - isOnFeedbackPage - Whether currently on the feedback page (affects certain options)
 * @returns Array of menu items to display
 */
export const getEventHeaderMenuItems = (params: {
  isOwnEvent: boolean;
  isArchived: boolean;
  isCanceled: boolean;
  userPermissions: Record<string, boolean>;
  isLoggedIn: boolean;
  eventId: string;
  isOnFeedbackPage?: boolean;
  feedbackEnabled?: boolean;
  relatedIssueLink?: RouteLocationRaw | null;
}): MenuItem<string | RouteLocationRaw>[] => {
  const {
    isOwnEvent,
    isArchived,
    isCanceled,
    userPermissions,
    isLoggedIn,
    eventId,
    isOnFeedbackPage = false,
    feedbackEnabled = true,
    relatedIssueLink = null,
  } = params;

  // Debug log to see the permissions before making menu decisions
  console.log('EVENT HEADER MENU PERMISSIONS:', {
    canHideEvent: userPermissions?.canHideEvent,
    isElevatedMod: userPermissions?.isElevatedMod,
    canReport: userPermissions?.canReport,
    canGiveFeedback: userPermissions?.canGiveFeedback,
    isOwnEvent,
    isArchived,
    isCanceled,
  });

  let menuItems: MenuItem<string | RouteLocationRaw>[] = [];

  if (relatedIssueLink) {
    menuItems.push({
      label: 'View Issue',
      value: relatedIssueLink,
      icon: ALLOWED_ICONS.VIEW_ISSUE,
    });
  }

  // Base menu items that don't depend on being on the feedback page
  if (!isOnFeedbackPage) {
    menuItems.push({
      label: 'Copy Link',
      event: 'copyLink',
      icon: ALLOWED_ICONS.COPY_LINK,
    });

    // Only add "View Feedback" if feedback is enabled on the channel
    if (feedbackEnabled) {
      menuItems.push({
        label: 'View Feedback',
        event: 'handleViewFeedback',
        icon: ALLOWED_ICONS.VIEW_FEEDBACK,
      });
    }
  }

  // Return early if user is not logged in
  if (!isLoggedIn) {
    return menuItems;
  }

  // If user is the author of the event
  if (isOwnEvent) {
    menuItems = menuItems.concat([
      {
        label: 'Edit',
        event: 'handleEdit',
        icon: ALLOWED_ICONS.EDIT,
      },
      {
        label: 'Delete',
        event: 'handleDelete',
        icon: ALLOWED_ICONS.DELETE,
      },
    ]);

    // Only show Cancel option if event is not already canceled
    if (!isCanceled) {
      menuItems.push({
        label: 'Cancel',
        event: 'handleCancel',
        icon: ALLOWED_ICONS.CANCEL,
      });
    }
  }

  // Check if the user has any moderation permission (standard mod or above)
  // Standard mods are neither elevated nor suspended, but should still see Report and Give Feedback options
  const canPerformModActions =
    !userPermissions.isSuspendedMod &&
    (userPermissions.isChannelOwner ||
      userPermissions.isElevatedMod ||
      userPermissions.canReport ||
      userPermissions.canGiveFeedback);

  // Show mod actions if user has any mod permissions and isn't the event creator
  if (isLoggedIn && canPerformModActions && !isOwnEvent) {
    // Create a list for mod actions
    const modActions: MenuItem[] = [];

    // Add report action if user has permission
    if (userPermissions.canReport) {
      modActions.push({
        label: 'Report',
        event: 'handleReport',
        icon: ALLOWED_ICONS.REPORT,
      });
    }

    // Add feedback action if user has permission and not on the feedback page
    if (userPermissions.canGiveFeedback && !isOnFeedbackPage) {
      modActions.push({
        label: 'Give Feedback',
        event: 'handleFeedback',
        icon: ALLOWED_ICONS.GIVE_FEEDBACK,
      });
    }

    // Add archive/unarchive actions based on current state and permissions
    if (!isArchived) {
      if (userPermissions.canHideEvent) {
        modActions.push({
          label: 'Archive',
          event: 'handleClickArchive',
          icon: ALLOWED_ICONS.ARCHIVE,
          value: eventId,
        });
      }

      if (userPermissions.canSuspendUser) {
        modActions.push({
          label: 'Archive and Suspend',
          event: 'handleClickArchiveAndSuspend',
          icon: ALLOWED_ICONS.SUSPEND,
          value: eventId,
        });
      }
    } else {
      if (userPermissions.canHideEvent) {
        modActions.push({
          label: 'Unarchive',
          event: 'handleClickUnarchive',
          icon: ALLOWED_ICONS.UNARCHIVE,
          value: eventId,
        });
      }
    }

    // Only add the mod actions section if there are actually actions to show
    if (modActions.length > 0) {
      menuItems.push({
        value: 'Moderation Actions',
        isDivider: true,
      });
      menuItems = menuItems.concat(modActions);
    }
  }

  return menuItems;
};

/**
 * Determines the admin/mod status labels for a comment header
 * Based on the user roles embedded in the comment data
 *
 * @param params - Parameters to determine the admin/mod status:
 *   - author - The comment author data
 * @returns Object with isAdmin and isMod booleans
 */
export const getCommentAuthorStatus = (params: {
  author: AuthorWithRoles | null | undefined;
}): { isAdmin: boolean; isMod: boolean } => {
  const { author } = params;

  if (!author) {
    return { isAdmin: false, isMod: false };
  }

  let isAdmin = false;
  let isMod = false;

  if (author.__typename === 'User') {
    // Check admin status from ServerRoles
    if (author.ServerRoles && author.ServerRoles.length > 0) {
      isAdmin = !!author.ServerRoles[0]?.showAdminTag;
    }

    // Check mod status from ChannelRoles
    if (author.ChannelRoles && author.ChannelRoles.length > 0) {
      isMod = !!author.ChannelRoles[0]?.showModTag;
    }
  }

  return { isAdmin, isMod };
};
