// Utility functions for handling comment operations
import { getPermalinkToEventComment, getPermalinkToEvent } from './routerUtils';
import {
  getDiscussionCommentRoute,
  getDiscussionRoute,
  getDownloadCommentRoute,
  getDownloadRoute,
} from './contentUrls';
import { getServerRoleBadge } from './serverRoleBadges';

// Type representing a comment with its context relationships
// All fields are optional to support partial data in tests and various use cases
type CommentWithContext = {
  id?: string;
  /** Public permalink handle; falls back to `id` when not selected. */
  shortId?: string | null;
  DiscussionChannel?: {
    channelUniqueName?: string;
    discussionId?: string;
    discussionNumber?: number | null;
    Discussion?: { hasDownload?: boolean | null; title?: string | null } | null;
  } | null;
  Channel?: { uniqueName?: string; displayName?: string | null } | null;
  Event?: {
    id?: string;
    title?: string | null;
    EventChannels?: Array<{
      channelUniqueName: string;
      eventNumber?: number | null;
    }>;
  } | null;
  CommentAuthor?: {
    __typename?: string;
    username?: string;
    displayName?: string | null;
    profilePicURL?: string | null;
    commentKarma?: number | null;
    discussionKarma?: number | null;
    createdAt?: string;
  } | null;
};

type GetCommentAuthorInfoOptions = {
  serverAdminUsernames?: string[];
};

/**
 * Get the permalink URL object for a comment
 */
export const getCommentPermalink = (comment: CommentWithContext) => {
  const commentSegment = comment.shortId || comment.id || '';
  if (comment.DiscussionChannel) {
    const channelUniqueName = comment.DiscussionChannel.channelUniqueName || '';
    const discussionId = comment.DiscussionChannel.discussionId || '';
    const discussionNumber = comment.DiscussionChannel.discussionNumber;
    const hasDownload = comment.DiscussionChannel.Discussion?.hasDownload;

    if (discussionNumber == null && !discussionId) {
      if (comment.Channel?.uniqueName) {
        return {
          name: 'forums-forumId-comments-commentId',
          params: {
            forumId: comment.Channel.uniqueName,
            commentId: commentSegment,
          },
        };
      }

      return channelUniqueName
        ? {
            name: 'forums-forumId',
            params: {
              forumId: channelUniqueName,
            },
          }
        : { name: 'index' };
    }

    const target = {
      forumId: channelUniqueName,
      discussionNumber,
      title: comment.DiscussionChannel.Discussion?.title,
      discussionId,
      shortId: comment.shortId,
      commentId: comment.id,
    };
    return hasDownload
      ? getDownloadCommentRoute(target)
      : getDiscussionCommentRoute(target);
  } else if (comment.Channel) {
    return {
      name: 'forums-forumId-comments-commentId',
      params: {
        forumId: comment.Channel.uniqueName || '',
        commentId: commentSegment,
      },
    };
  } else if (comment.Event) {
    const eventChannel = comment.Event.EventChannels?.[0];
    return getPermalinkToEventComment({
      forumId: eventChannel?.channelUniqueName || '',
      eventNumber: eventChannel?.eventNumber,
      eventTitle: comment.Event.title,
      eventId: comment.Event.id || '',
      shortId: comment.shortId,
      commentId: comment.id,
    });
  }
  return { name: 'index' }; // fallback to home
};

/**
 * Get the permalink URL object for the context (parent content) of a comment
 */
export const getCommentContextPermalink = (comment: CommentWithContext) => {
  if (comment.DiscussionChannel) {
    const channelUniqueName = comment.DiscussionChannel.channelUniqueName || '';
    const discussionId = comment.DiscussionChannel.discussionId || '';
    const discussionNumber = comment.DiscussionChannel.discussionNumber;
    const hasDownload = comment.DiscussionChannel.Discussion?.hasDownload;

    if (discussionNumber == null && !discussionId) {
      return channelUniqueName
        ? {
            name: 'forums-forumId',
            params: {
              forumId: channelUniqueName,
            },
          }
        : { name: 'index' };
    }

    const target = {
      forumId: channelUniqueName,
      discussionNumber,
      title: comment.DiscussionChannel.Discussion?.title,
      discussionId,
    };
    return hasDownload ? getDownloadRoute(target) : getDiscussionRoute(target);
  } else if (comment.Channel) {
    return {
      name: 'forums-forumId',
      params: {
        forumId: comment.Channel.uniqueName || '',
      },
    };
  } else if (comment.Event) {
    const eventChannel = comment.Event.EventChannels?.[0];
    return getPermalinkToEvent({
      forumId: eventChannel?.channelUniqueName || '',
      eventNumber: eventChannel?.eventNumber,
      eventTitle: comment.Event.title,
      eventId: comment.Event.id || '',
    });
  }
  return { name: 'index' }; // fallback to home
};

/**
 * Get the title of the context (parent content) that the comment belongs to
 */
export const getCommentContextTitle = (comment: CommentWithContext): string => {
  if (comment.DiscussionChannel?.Discussion?.title) {
    return comment.DiscussionChannel.Discussion.title;
  } else if (comment.Channel?.displayName || comment.Channel?.uniqueName) {
    return comment.Channel.displayName || comment.Channel.uniqueName || 'Unknown';
  } else if (comment.Event?.title) {
    return comment.Event.title;
  }
  return 'Unknown';
};

/**
 * Get the type of context (parent content) that the comment belongs to
 */
export const getCommentContextType = (comment: CommentWithContext): string => {
  if (comment.DiscussionChannel) {
    return comment.DiscussionChannel.Discussion?.hasDownload
      ? 'Download'
      : 'Discussion';
  } else if (comment.Channel) {
    return 'Forum';
  } else if (comment.Event) {
    return 'Event';
  }
  return 'Unknown';
};

/**
 * Get author information from a comment, handling both User and ModerationProfile types
 */
export const getCommentAuthorInfo = (
  comment: CommentWithContext | null | undefined,
  options: GetCommentAuthorInfoOptions = {}
) => {
  const author = comment?.CommentAuthor;
  if (!author) return null;

  if (author.__typename === 'User') {
    const serverRoleBadge = getServerRoleBadge({
      username: author.username,
      adminUsernames: options.serverAdminUsernames || [],
    });

    return {
      username: author.username || '',
      displayName: author.displayName || '',
      profilePicURL: author.profilePicURL || '',
      commentKarma: author.commentKarma ?? 0,
      discussionKarma: author.discussionKarma ?? 0,
      createdAt: author.createdAt || '',
      isAdmin: serverRoleBadge === 'serverAdmin',
      isModerationProfile: false,
    };
  } else if (author.__typename === 'ModerationProfile') {
    return {
      displayName: author.displayName || '',
      isModerationProfile: true,
      username: '',
      profilePicURL: '',
      commentKarma: 0,
      discussionKarma: 0,
      createdAt: '',
      isAdmin: false,
    };
  }

  return null;
};
