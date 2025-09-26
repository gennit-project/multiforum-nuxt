// Utility functions for handling comment operations
import {
  getPermalinkToDiscussionComment,
  getPermalinkToEventComment,
  getPermalinkToDiscussion,
  getPermalinkToEvent,
} from './routerUtils';

/**
 * Get the permalink URL object for a comment
 */
export const getCommentPermalink = (comment: any) => {
  if (comment.DiscussionChannel) {
    const channelUniqueName = comment.DiscussionChannel.channelUniqueName;
    const discussionId = comment.DiscussionChannel.discussionId;
    const hasDownload = comment.DiscussionChannel.Discussion?.hasDownload;

    if (hasDownload) {
      return {
        name: 'forums-forumId-downloads-discussionId-comments-commentId',
        params: {
          forumId: channelUniqueName,
          discussionId,
          commentId: comment.id,
        },
      };
    } else {
      return getPermalinkToDiscussionComment({
        forumId: channelUniqueName,
        discussionId,
        commentId: comment.id,
      });
    }
  } else if (comment.Channel) {
    return {
      name: 'forums-forumId-comments-commentId',
      params: {
        forumId: comment.Channel.uniqueName,
        commentId: comment.id,
      },
    };
  } else if (comment.Event) {
    const channelUniqueName = comment.Event.EventChannels?.[0]?.channelUniqueName;
    return getPermalinkToEventComment({
      forumId: channelUniqueName || '',
      eventId: comment.Event.id,
      commentId: comment.id,
    });
  }
  return { name: 'index' }; // fallback to home
};

/**
 * Get the permalink URL object for the context (parent content) of a comment
 */
export const getCommentContextPermalink = (comment: any) => {
  if (comment.DiscussionChannel) {
    const channelUniqueName = comment.DiscussionChannel.channelUniqueName;
    const discussionId = comment.DiscussionChannel.discussionId;
    const hasDownload = comment.DiscussionChannel.Discussion?.hasDownload;

    if (hasDownload) {
      return {
        name: 'forums-forumId-downloads-discussionId',
        params: {
          forumId: channelUniqueName,
          discussionId,
        },
      };
    } else {
      return getPermalinkToDiscussion({
        forumId: channelUniqueName,
        discussionId,
      });
    }
  } else if (comment.Channel) {
    return {
      name: 'forums-forumId',
      params: {
        forumId: comment.Channel.uniqueName,
      },
    };
  } else if (comment.Event) {
    const channelUniqueName = comment.Event.EventChannels?.[0]?.channelUniqueName;
    return getPermalinkToEvent({
      forumId: channelUniqueName || '',
      eventId: comment.Event.id,
    });
  }
  return { name: 'index' }; // fallback to home
};

/**
 * Get the title of the context (parent content) that the comment belongs to
 */
export const getCommentContextTitle = (comment: any): string => {
  if (comment.DiscussionChannel?.Discussion?.title) {
    return comment.DiscussionChannel.Discussion.title;
  } else if (comment.Channel?.displayName || comment.Channel?.uniqueName) {
    return comment.Channel.displayName || comment.Channel.uniqueName;
  } else if (comment.Event?.title) {
    return comment.Event.title;
  }
  return 'Unknown';
};

/**
 * Get the type of context (parent content) that the comment belongs to
 */
export const getCommentContextType = (comment: any): string => {
  if (comment.DiscussionChannel) {
    return comment.DiscussionChannel.Discussion?.hasDownload ? 'Download' : 'Discussion';
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
export const getCommentAuthorInfo = (comment: any) => {
  const author = comment?.CommentAuthor;
  if (!author) return null;

  if (author.__typename === 'User') {
    return {
      username: author.username || '',
      displayName: author.displayName || '',
      profilePicURL: author.profilePicURL || '',
      commentKarma: author.commentKarma ?? 0,
      discussionKarma: author.discussionKarma ?? 0,
      createdAt: author.createdAt || '',
      isAdmin: author.ServerRoles?.[0]?.showAdminTag || false,
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