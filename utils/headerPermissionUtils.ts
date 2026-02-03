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

// Content type for archive/unarchive operations
type ContentType = 'discussion' | 'event' | 'comment';

// Permission key for hiding content by type
const HIDE_PERMISSION_MAP: Record<ContentType, string> = {
  discussion: 'canHideDiscussion',
  event: 'canHideEvent',
  comment: 'canHideComment',
};

/**
 * Checks if a user can perform moderation actions based on their permissions
 *
 * @param userPermissions - Object with all user permissions
 * @param contentType - The type of content being moderated (affects which permissions are checked)
 * @returns boolean indicating if the user can perform mod actions
 */
export const canPerformModActions = (
  userPermissions: Record<string, boolean>,
  contentType?: ContentType
): boolean => {
  // Suspended mods cannot perform any mod actions
  if (userPermissions.isSuspendedMod) {
    return false;
  }

  // Base checks that apply to all content types
  const hasBasePermission =
    userPermissions.isChannelOwner ||
    userPermissions.isElevatedMod ||
    userPermissions.canReport ||
    userPermissions.canGiveFeedback;

  if (hasBasePermission) {
    return true;
  }

  // Additional checks for specific content types
  if (contentType === 'discussion') {
    return !!(
      userPermissions.canHideDiscussion || userPermissions.canSuspendUser
    );
  }

  if (contentType === 'event') {
    return !!(userPermissions.canHideEvent || userPermissions.canSuspendUser);
  }

  if (contentType === 'comment') {
    return !!(userPermissions.canHideComment || userPermissions.canSuspendUser);
  }

  return false;
};

/**
 * Builds archive/unarchive menu items based on content state and permissions
 *
 * @param params - Parameters for building archive menu items
 * @returns Array of menu items for archive/unarchive actions
 */
export const buildArchiveMenuItems = (params: {
  isArchived: boolean;
  userPermissions: Record<string, boolean>;
  contentType: ContentType;
  contentId: string;
  archiveEvent?: string;
  unarchiveEvent?: string;
  archiveAndSuspendEvent?: string;
}): MenuItem[] => {
  const {
    isArchived,
    userPermissions,
    contentType,
    contentId,
    archiveEvent = 'handleClickArchive',
    unarchiveEvent = 'handleClickUnarchive',
    archiveAndSuspendEvent = 'handleClickArchiveAndSuspend',
  } = params;

  const modActions: MenuItem[] = [];
  const hidePermission = HIDE_PERMISSION_MAP[contentType];

  if (!isArchived) {
    if (userPermissions[hidePermission]) {
      modActions.push({
        label: 'Archive',
        event: archiveEvent,
        icon: ALLOWED_ICONS.ARCHIVE,
        value: contentId,
      });
    }

    if (userPermissions.canSuspendUser) {
      modActions.push({
        label: 'Archive and Suspend',
        event: archiveAndSuspendEvent,
        icon: ALLOWED_ICONS.SUSPEND,
        value: contentId,
      });
    }
  } else {
    if (userPermissions[hidePermission]) {
      modActions.push({
        label: 'Unarchive',
        event: unarchiveEvent,
        icon: ALLOWED_ICONS.UNARCHIVE,
        value: contentId,
      });
    }
  }

  return modActions;
};

/**
 * Builds the moderation section with divider and actions
 *
 * @param modActions - Array of moderation action menu items
 * @returns Array with divider and actions, or empty array if no actions
 */
export const buildModerationSection = (
  modActions: MenuItem[]
): MenuItem[] => {
  if (modActions.length === 0) {
    return [];
  }

  return [
    {
      value: 'Moderation Actions',
      isDivider: true,
      label: '',
    },
    ...modActions,
  ];
};

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

  // Show mod actions if user has any mod permissions and isn't the discussion creator
  if (
    isLoggedIn &&
    canPerformModActions(userPermissions, 'discussion') &&
    !isOwnDiscussion
  ) {
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

    // Add archive/unarchive actions using shared helper
    const archiveItems = buildArchiveMenuItems({
      isArchived,
      userPermissions,
      contentType: 'discussion',
      contentId: discussionId,
    });
    modActions.push(...archiveItems);

    // Add the mod actions section using shared helper
    menuItems = menuItems.concat(buildModerationSection(modActions));
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

  // Show mod actions if user has any mod permissions and isn't the event creator
  if (
    isLoggedIn &&
    canPerformModActions(userPermissions, 'event') &&
    !isOwnEvent
  ) {
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

    // Add archive/unarchive actions using shared helper
    const archiveItems = buildArchiveMenuItems({
      isArchived,
      userPermissions,
      contentType: 'event',
      contentId: eventId,
    });
    modActions.push(...archiveItems);

    // Add the mod actions section using shared helper
    menuItems = menuItems.concat(buildModerationSection(modActions));
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

/**
 * Determines which actions should be available in the comment menu
 * based on user permissions and the comment state
 *
 * @param params - Parameters to determine which menu items to show:
 *   - isOwnComment - Whether the current user is the author of the comment
 *   - isArchived - Whether the comment is archived
 *   - isDiscussionAuthor - Whether the current user is the author of the discussion
 *   - isMarkedAsAnswer - Whether this comment is marked as a best answer
 *   - depth - The nesting depth of the comment (1 = root comment)
 *   - discussionId - ID of the discussion (if applicable)
 *   - userPermissions - Object with all user permissions from getAllPermissions utility
 *   - isLoggedIn - Whether the user is logged in
 *   - enableFeedback - Whether feedback is enabled on the channel
 *   - canShowPermalink - Whether we can show a permalink for this comment
 *   - hasPermalinkObject - Whether we have a valid permalink object
 *   - hasFeedbackComments - Whether this comment has feedback comments
 * @returns Array of menu items to display
 */
export const getCommentMenuItems = (params: {
  isOwnComment: boolean;
  isArchived: boolean;
  isDiscussionAuthor: boolean;
  isMarkedAsAnswer: boolean;
  depth: number;
  discussionId: string | undefined;
  userPermissions: Record<string, boolean>;
  isLoggedIn: boolean;
  enableFeedback: boolean;
  canShowPermalink: boolean;
  hasPermalinkObject: boolean;
  hasFeedbackComments: boolean;
}): MenuItem[] => {
  const {
    isOwnComment,
    isArchived,
    isDiscussionAuthor,
    isMarkedAsAnswer,
    depth,
    discussionId,
    userPermissions,
    isLoggedIn,
    enableFeedback,
    canShowPermalink,
    hasPermalinkObject,
    hasFeedbackComments,
  } = params;

  let menuItems: MenuItem[] = [];

  // Only show Copy Link when we have a valid permalink
  if (canShowPermalink && hasPermalinkObject) {
    menuItems.push({
      label: 'Copy Link',
      value: '',
      event: 'copyLink',
      icon: ALLOWED_ICONS.COPY_LINK,
    });
  }

  // Always show feedback option if enabled
  if (enableFeedback) {
    menuItems.push({
      label: 'View Feedback',
      value: '',
      event: 'handleViewFeedback',
      icon: ALLOWED_ICONS.VIEW_FEEDBACK,
    });
  }

  // Return early if user is not logged in
  if (!isLoggedIn) {
    return menuItems;
  }

  // If user is the author of the comment
  if (isOwnComment) {
    menuItems.push({
      label: 'Edit',
      value: '',
      event: 'handleEdit',
      icon: ALLOWED_ICONS.EDIT,
    });
    menuItems.push({
      label: 'Delete',
      value: '',
      event: 'handleDelete',
      icon: ALLOWED_ICONS.DELETE,
    });
  }

  // If user is the discussion author and this is a root comment in a discussion
  if (isDiscussionAuthor && discussionId && depth === 1 && !isOwnComment) {
    if (!isMarkedAsAnswer) {
      menuItems.push({
        label: 'Mark as Best Answer',
        value: '',
        event: 'handleMarkAsBestAnswer',
        icon: ALLOWED_ICONS.MARK_BEST_ANSWER,
      });
    } else {
      menuItems.push({
        label: 'Undo Mark as Best Answer',
        value: '',
        event: 'handleUnmarkAsBestAnswer',
        icon: ALLOWED_ICONS.UNDO,
      });
    }
  }

  // Show mod actions if user has any mod permissions and isn't the comment author
  if (
    isLoggedIn &&
    canPerformModActions(userPermissions, 'comment') &&
    !isOwnComment
  ) {
    // Create a list for mod actions
    const modActions: MenuItem[] = [];

    // Add report action if user has permission
    if (userPermissions.canReport) {
      modActions.push({
        label: 'Report',
        value: '',
        event: 'clickReport',
        icon: ALLOWED_ICONS.REPORT,
      });
    }

    // Add feedback action if user has permission and feedback is enabled
    if (userPermissions.canGiveFeedback && enableFeedback) {
      modActions.push({
        label: 'Give Feedback',
        value: '',
        event: 'clickFeedback',
        icon: ALLOWED_ICONS.GIVE_FEEDBACK,
      });
    }

    // Add feedback management actions if comment has feedback
    if (enableFeedback && hasFeedbackComments) {
      modActions.push({
        label: 'Undo Feedback',
        value: '',
        event: 'clickUndoFeedback',
        icon: ALLOWED_ICONS.UNDO,
      });
      modActions.push({
        label: 'Edit Feedback',
        value: '',
        event: 'clickEditFeedback',
        icon: ALLOWED_ICONS.EDIT,
      });
    }

    // Add archive/unarchive actions using shared helper
    const archiveItems = buildArchiveMenuItems({
      isArchived,
      userPermissions,
      contentType: 'comment',
      contentId: '',
    });
    modActions.push(...archiveItems);

    // Add the mod actions section using shared helper
    menuItems = menuItems.concat(buildModerationSection(modActions));
  }

  return menuItems;
};
