import type { RouteLocationRaw } from 'vue-router';

type ChannelLike = {
  uniqueName?: string | null;
};

type DiscussionChannelLike = {
  channelUniqueName?: string | null;
  discussionId?: string | null;
};

type EventChannelLike = {
  channelUniqueName?: string | null;
};

type EventLike = {
  id?: string | null;
  EventChannels?: EventChannelLike[] | null;
};

type IssueLike = {
  issueNumber?: number | string | null;
  channelUniqueName?: string | null;
  Channel?: ChannelLike | null;
};

export type CommentPermalinkInput = {
  id?: string | null;
  Channel?: ChannelLike | null;
  DiscussionChannel?: DiscussionChannelLike | null;
  Event?: EventLike | null;
  Issue?: IssueLike | null;
};

type CommentPermalinkOptions = {
  fallbackForumId?: string | null;
  fallbackDiscussionId?: string | null;
  fallbackEventId?: string | null;
  fallbackIssueNumber?: string | number | null;
};

export function getCommentForumId(
  comment: CommentPermalinkInput,
  fallbackForumId?: string | null
) {
  return (
    comment.Channel?.uniqueName ||
    comment.DiscussionChannel?.channelUniqueName ||
    comment.Event?.EventChannels?.[0]?.channelUniqueName ||
    comment.Issue?.channelUniqueName ||
    comment.Issue?.Channel?.uniqueName ||
    fallbackForumId ||
    ''
  );
}

export function getCommentPermalinkRoute(
  comment: CommentPermalinkInput,
  options: CommentPermalinkOptions = {}
): RouteLocationRaw | null {
  if (!comment.id) {
    return null;
  }

  const forumId = getCommentForumId(comment, options.fallbackForumId);

  const discussionId =
    comment.DiscussionChannel?.discussionId || options.fallbackDiscussionId;
  if (discussionId && forumId) {
    return {
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        forumId,
        discussionId,
        commentId: comment.id,
      },
    };
  }

  const eventId = comment.Event?.id || options.fallbackEventId;
  if (eventId && forumId) {
    return {
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: {
        forumId,
        eventId,
        commentId: comment.id,
      },
    };
  }

  const issueNumber =
    comment.Issue?.issueNumber || options.fallbackIssueNumber;
  if (issueNumber && forumId) {
    return {
      name: 'forums-forumId-issues-issueNumber-comments-commentId',
      params: {
        forumId,
        issueNumber,
        commentId: comment.id,
      },
    };
  }

  return null;
}
