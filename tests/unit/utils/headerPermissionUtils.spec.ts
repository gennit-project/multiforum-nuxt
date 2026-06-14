import { describe, it, expect } from 'vitest';
import {
  canPerformModActions,
  buildArchiveMenuItems,
  buildModerationSection,
  getDiscussionHeaderMenuItems,
  getEventHeaderMenuItems,
  getCommentAuthorStatus,
  getCommentMenuItems,
} from '@/utils/headerPermissionUtils';
import type { PermissionFlags } from '@/utils/permissionUtils';

// Helper to create a base permission object with all flags false
const createBasePermissions = (
  overrides: Partial<PermissionFlags> = {}
): PermissionFlags => ({
  // Core permission keys
  canReport: false,
  canGiveFeedback: false,
  canHideComment: false,
  canHideDiscussion: false,
  canHideEvent: false,
  canEditComments: false,
  canEditDiscussions: false,
  canEditEvents: false,
  canSuspendUser: false,
  canOpenSupportTickets: false,
  canCloseSupportTickets: false,
  canLockChannel: false,
  // Additional permission keys
  canEditWiki: false,
  canAddMods: false,
  canRemoveMods: false,
  canAddOwners: false,
  canRemoveOwners: false,
  canChangeSettings: false,
  // Role state keys
  isChannelOwner: false,
  isElevatedMod: false,
  isSuspendedMod: false,
  isSuspendedUser: false,
  ...overrides,
});

describe('canPerformModActions', () => {
  it('returns false for suspended mod', () => {
    const permissions = createBasePermissions({
      isSuspendedMod: true,
      canReport: true,
    });

    expect(canPerformModActions(permissions)).toBe(false);
  });

  it('returns true for channel owner', () => {
    const permissions = createBasePermissions({ isChannelOwner: true });

    expect(canPerformModActions(permissions)).toBe(true);
  });

  it('returns true for elevated mod', () => {
    const permissions = createBasePermissions({ isElevatedMod: true });

    expect(canPerformModActions(permissions)).toBe(true);
  });

  it('returns true if user can report', () => {
    const permissions = createBasePermissions({ canReport: true });

    expect(canPerformModActions(permissions)).toBe(true);
  });

  it('returns true if user can give feedback', () => {
    const permissions = createBasePermissions({ canGiveFeedback: true });

    expect(canPerformModActions(permissions)).toBe(true);
  });

  it('returns true for discussion type with canHideDiscussion', () => {
    const permissions = createBasePermissions({ canHideDiscussion: true });

    expect(canPerformModActions(permissions, 'discussion')).toBe(true);
  });

  it('returns true for event type with canHideEvent', () => {
    const permissions = createBasePermissions({ canHideEvent: true });

    expect(canPerformModActions(permissions, 'event')).toBe(true);
  });

  it('returns true for comment type with canHideComment', () => {
    const permissions = createBasePermissions({ canHideComment: true });

    expect(canPerformModActions(permissions, 'comment')).toBe(true);
  });

  it('returns true for any content type with canSuspendUser', () => {
    const permissions = createBasePermissions({ canSuspendUser: true });

    expect(canPerformModActions(permissions, 'discussion')).toBe(true);
    expect(canPerformModActions(permissions, 'event')).toBe(true);
    expect(canPerformModActions(permissions, 'comment')).toBe(true);
  });

  it('returns false when no permissions match content type', () => {
    const permissions = createBasePermissions({ canHideDiscussion: true });

    // canHideDiscussion doesn't grant permission for events
    expect(canPerformModActions(permissions, 'event')).toBe(false);
  });

  it('returns false for user with no permissions', () => {
    const permissions = createBasePermissions();

    expect(canPerformModActions(permissions)).toBe(false);
    expect(canPerformModActions(permissions, 'discussion')).toBe(false);
  });
});

describe('buildArchiveMenuItems', () => {
  it('returns archive item when not archived and user can hide discussion', () => {
    const items = buildArchiveMenuItems({
      isArchived: false,
      userPermissions: createBasePermissions({ canHideDiscussion: true }),
      contentType: 'discussion',
      contentId: 'disc-123',
    });

    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe('Archive');
    expect(items[0]!.event).toBe('handleClickArchive');
  });

  it('returns archive and suspend when user can suspend', () => {
    const items = buildArchiveMenuItems({
      isArchived: false,
      userPermissions: createBasePermissions({ canSuspendUser: true }),
      contentType: 'discussion',
      contentId: 'disc-123',
    });

    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe('Archive and Suspend');
    expect(items[0]!.event).toBe('handleClickArchiveAndSuspend');
  });

  it('returns both archive options when user has both permissions', () => {
    const items = buildArchiveMenuItems({
      isArchived: false,
      userPermissions: createBasePermissions({
        canHideDiscussion: true,
        canSuspendUser: true,
      }),
      contentType: 'discussion',
      contentId: 'disc-123',
    });

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.label)).toEqual(['Archive', 'Archive and Suspend']);
  });

  it('returns unarchive item when archived', () => {
    const items = buildArchiveMenuItems({
      isArchived: true,
      userPermissions: createBasePermissions({ canHideEvent: true }),
      contentType: 'event',
      contentId: 'event-456',
    });

    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe('Unarchive');
    expect(items[0]!.event).toBe('handleClickUnarchive');
  });

  it('uses custom event names when provided', () => {
    const items = buildArchiveMenuItems({
      isArchived: false,
      userPermissions: createBasePermissions({ canHideComment: true }),
      contentType: 'comment',
      contentId: 'comment-789',
      archiveEvent: 'customArchive',
      unarchiveEvent: 'customUnarchive',
    });

    expect(items[0]!.event).toBe('customArchive');
  });

  it('returns empty array when user has no hide permissions', () => {
    const items = buildArchiveMenuItems({
      isArchived: false,
      userPermissions: createBasePermissions(),
      contentType: 'discussion',
      contentId: 'disc-123',
    });

    expect(items).toEqual([]);
  });
});

describe('buildModerationSection', () => {
  it('returns empty array when no mod actions', () => {
    expect(buildModerationSection([])).toEqual([]);
  });

  it('prepends divider to mod actions', () => {
    const modActions = [
      { label: 'Report', event: 'handleReport', value: '' },
    ];

    const result = buildModerationSection(modActions);

    expect(result).toHaveLength(2);
    expect(result[0]!.isDivider).toBe(true);
    expect(result[0]!.value).toBe('Moderation Actions');
    expect(result[1]!.label).toBe('Report');
  });
});

describe('getDiscussionHeaderMenuItems', () => {
  const baseParams = {
    isOwnDiscussion: false,
    isArchived: false,
    userPermissions: createBasePermissions(),
    isLoggedIn: false,
    discussionId: 'disc-123',
  };

  it('returns View Feedback for unauthenticated user when feedback enabled', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      feedbackEnabled: true,
    });

    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe('View Feedback');
  });

  it('excludes View Feedback when feedback disabled', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      feedbackEnabled: false,
    });

    expect(items).toHaveLength(0);
  });

  it('includes View Issue when relatedIssueLink provided', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      relatedIssueLink: { name: 'issues', params: { id: '1' } },
    });

    expect(items.find((i) => i.label === 'View Issue')).toBeDefined();
  });

  it('adds Edit, Delete, and sensitive toggle for own discussion', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isOwnDiscussion: true,
      isLoggedIn: true,
    });

    const labels = items.map((i) => i.label);
    expect(labels).toContain('Edit');
    expect(labels).toContain('Delete');
    expect(labels).toContain('Mark as sensitive content');
  });

  it('shows Mark as non-sensitive when hasSensitiveContent is true', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isOwnDiscussion: true,
      isLoggedIn: true,
      hasSensitiveContent: true,
    });

    expect(items.find((i) => i.label === 'Mark as non-sensitive content')).toBeDefined();
  });

  it('includes Add Album when user owns discussion without album', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isOwnDiscussion: true,
      isLoggedIn: true,
      hasAlbum: false,
    });

    expect(items.find((i) => i.label === 'Add Album')).toBeDefined();
  });

  it('excludes Add Album when discussion has album', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isOwnDiscussion: true,
      isLoggedIn: true,
      hasAlbum: true,
    });

    expect(items.find((i) => i.label === 'Add Album')).toBeUndefined();
  });

  it('includes mod actions for user with canReport permission', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isLoggedIn: true,
      userPermissions: createBasePermissions({ canReport: true }),
    });

    expect(items.find((i) => i.label === 'Report')).toBeDefined();
  });

  it('includes Give Feedback for user with canGiveFeedback permission', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isLoggedIn: true,
      userPermissions: createBasePermissions({ canGiveFeedback: true }),
    });

    expect(items.find((i) => i.label === 'Give Feedback')).toBeDefined();
  });

  it('excludes mod actions for own discussion', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isOwnDiscussion: true,
      isLoggedIn: true,
      userPermissions: createBasePermissions({ canReport: true }),
    });

    expect(items.find((i) => i.label === 'Report')).toBeUndefined();
  });

  it('includes archive actions for moderator', () => {
    const items = getDiscussionHeaderMenuItems({
      ...baseParams,
      isLoggedIn: true,
      userPermissions: createBasePermissions({
        canHideDiscussion: true,
        canReport: true,
      }),
    });

    expect(items.find((i) => i.label === 'Archive')).toBeDefined();
  });
});

describe('getEventHeaderMenuItems', () => {
  const baseParams = {
    isOwnEvent: false,
    isArchived: false,
    isCanceled: false,
    userPermissions: createBasePermissions(),
    isLoggedIn: false,
    eventId: 'event-123',
  };

  it('includes Copy Link and View Feedback by default', () => {
    const items = getEventHeaderMenuItems(baseParams);

    expect(items.find((i) => i.label === 'Copy Link')).toBeDefined();
    expect(items.find((i) => i.label === 'View Feedback')).toBeDefined();
  });

  it('excludes Copy Link and View Feedback on feedback page', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      isOnFeedbackPage: true,
    });

    expect(items.find((i) => i.label === 'Copy Link')).toBeUndefined();
    expect(items.find((i) => i.label === 'View Feedback')).toBeUndefined();
  });

  it('includes View Issue when relatedIssueLink provided', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      relatedIssueLink: { name: 'issues', params: { id: '1' } },
    });

    expect(items.find((i) => i.label === 'View Issue')).toBeDefined();
  });

  it('adds Edit, Delete, Cancel for own event', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      isOwnEvent: true,
      isLoggedIn: true,
    });

    const labels = items.map((i) => i.label);
    expect(labels).toContain('Edit');
    expect(labels).toContain('Delete');
    expect(labels).toContain('Cancel');
  });

  it('excludes Cancel when event is already canceled', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      isOwnEvent: true,
      isLoggedIn: true,
      isCanceled: true,
    });

    expect(items.find((i) => i.label === 'Cancel')).toBeUndefined();
  });

  it('includes mod actions for user with canReport permission', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      isLoggedIn: true,
      userPermissions: createBasePermissions({ canReport: true }),
    });

    expect(items.find((i) => i.label === 'Report')).toBeDefined();
  });

  it('excludes Give Feedback on feedback page even with permission', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      isLoggedIn: true,
      isOnFeedbackPage: true,
      userPermissions: createBasePermissions({ canGiveFeedback: true }),
    });

    expect(items.find((i) => i.label === 'Give Feedback')).toBeUndefined();
  });

  it('excludes View Feedback when feedbackEnabled is false', () => {
    const items = getEventHeaderMenuItems({
      ...baseParams,
      feedbackEnabled: false,
    });

    expect(items.find((i) => i.label === 'View Feedback')).toBeUndefined();
  });
});

describe('getCommentAuthorStatus', () => {
  it('returns false for both when author is null', () => {
    const result = getCommentAuthorStatus({ author: null });

    expect(result).toEqual({ isAdmin: false, isMod: false });
  });

  it('returns isAdmin true for User in serverAdminUsernames', () => {
    const result = getCommentAuthorStatus({
      author: { __typename: 'User', username: 'adminuser' },
      serverAdminUsernames: ['adminuser'],
    });

    expect(result.isAdmin).toBe(true);
  });

  it('returns isMod true for User with showModTag in ChannelRoles', () => {
    const result = getCommentAuthorStatus({
      author: {
        __typename: 'User',
        username: 'moduser',
        ChannelRoles: [{ showModTag: true }],
      },
    });

    expect(result.isMod).toBe(true);
  });

  it('returns isMod true for User in serverModUsernames', () => {
    const result = getCommentAuthorStatus({
      author: { __typename: 'User', username: 'servermod' },
      serverModUsernames: ['servermod'],
    });

    expect(result.isMod).toBe(true);
  });

  it('returns isMod true for ModerationProfile in serverModProfileNames', () => {
    const result = getCommentAuthorStatus({
      author: { __typename: 'ModerationProfile', displayName: 'ModProfile' },
      serverModProfileNames: ['ModProfile'],
    });

    expect(result.isMod).toBe(true);
  });
});

describe('getCommentMenuItems', () => {
  const baseParams = {
    isOwnComment: false,
    isWatchingReplies: false,
    isArchived: false,
    isDiscussionAuthor: false,
    isMarkedAsAnswer: false,
    depth: 1,
    discussionId: 'disc-123',
    userPermissions: createBasePermissions(),
    isLoggedIn: false,
    enableFeedback: true,
    canShowPermalink: true,
    hasPermalinkObject: true,
    hasFeedbackComments: false,
  };

  it('includes Copy Link when permalink available', () => {
    const items = getCommentMenuItems(baseParams);

    expect(items.find((i) => i.label === 'Copy Link')).toBeDefined();
  });

  it('excludes Copy Link when canShowPermalink is false', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      canShowPermalink: false,
    });

    expect(items.find((i) => i.label === 'Copy Link')).toBeUndefined();
  });

  it('includes View Feedback when enabled', () => {
    const items = getCommentMenuItems(baseParams);

    expect(items.find((i) => i.label === 'View Feedback')).toBeDefined();
  });

  it('excludes View Feedback when disabled', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      enableFeedback: false,
    });

    expect(items.find((i) => i.label === 'View Feedback')).toBeUndefined();
  });

  it('includes Watch Replies for logged in user', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isLoggedIn: true,
    });

    expect(items.find((i) => i.label === 'Watch Replies')).toBeDefined();
  });

  it('shows Unwatch Replies when already watching', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isLoggedIn: true,
      isWatchingReplies: true,
    });

    expect(items.find((i) => i.label === 'Unwatch Replies')).toBeDefined();
  });

  it('includes Edit and Delete for own comment', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isOwnComment: true,
      isLoggedIn: true,
    });

    expect(items.find((i) => i.label === 'Edit')).toBeDefined();
    expect(items.find((i) => i.label === 'Delete')).toBeDefined();
  });

  it('includes Mark as Best Answer for discussion author on root comment', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isDiscussionAuthor: true,
      isLoggedIn: true,
      depth: 1,
    });

    expect(items.find((i) => i.label === 'Mark as Best Answer')).toBeDefined();
  });

  it('excludes Mark as Best Answer for nested comments', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isDiscussionAuthor: true,
      isLoggedIn: true,
      depth: 2,
    });

    expect(items.find((i) => i.label === 'Mark as Best Answer')).toBeUndefined();
  });

  it('shows Undo Mark as Best Answer when already marked', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isDiscussionAuthor: true,
      isLoggedIn: true,
      depth: 1,
      isMarkedAsAnswer: true,
    });

    expect(items.find((i) => i.label === 'Undo Mark as Best Answer')).toBeDefined();
  });

  it('excludes Mark as Best Answer for own comment', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isDiscussionAuthor: true,
      isOwnComment: true,
      isLoggedIn: true,
      depth: 1,
    });

    expect(items.find((i) => i.label === 'Mark as Best Answer')).toBeUndefined();
  });

  it('includes Undo Feedback and Edit Feedback when hasFeedbackComments', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isLoggedIn: true,
      hasFeedbackComments: true,
      userPermissions: createBasePermissions({ canGiveFeedback: true }),
    });

    expect(items.find((i) => i.label === 'Undo Feedback')).toBeDefined();
    expect(items.find((i) => i.label === 'Edit Feedback')).toBeDefined();
  });

  it('excludes feedback management when hasFeedbackComments is false', () => {
    const items = getCommentMenuItems({
      ...baseParams,
      isLoggedIn: true,
      hasFeedbackComments: false,
      userPermissions: createBasePermissions({ canGiveFeedback: true }),
    });

    expect(items.find((i) => i.label === 'Undo Feedback')).toBeUndefined();
  });
});
