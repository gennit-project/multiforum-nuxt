import type { RouteLocationRaw } from 'vue-router';
import {
  getDiscussionCommentRoute,
  getEventCommentRoute,
  getCommentSegment,
} from '@/utils/contentUrls';
import { parseSlugSegmentNumber } from '@/utils/slugify';

type ChannelLike = {
  uniqueName?: string | null;
};

type DiscussionChannelLike = {
  channelUniqueName?: string | null;
  discussionId?: string | null;
  discussionNumber?: number | null;
  Discussion?: { title?: string | null } | null;
};

type EventChannelLike = {
  channelUniqueName?: string | null;
  eventNumber?: number | null;
};

type EventLike = {
  id?: string | null;
  title?: string | null;
  EventChannels?: EventChannelLike[] | null;
};

type IssueLike = {
  issueNumber?: number | string | null;
  channelUniqueName?: string | null;
  Channel?: ChannelLike | null;
};

export type CommentPermalinkInput = {
  id?: string | null;
  /** Public permalink handle; the route's `commentId` param carries it. */
  shortId?: string | null;
  Channel?: ChannelLike | null;
  DiscussionChannel?: DiscussionChannelLike | null;
  Event?: EventLike | null;
  Issue?: IssueLike | null;
};

type CommentPermalinkOptions = {
  fallbackForumId?: string | null;
  /**
   * The current route's `discussionId` param, i.e. a `{number}-{slug}` segment.
   * Used when the comment doesn't carry the discussion number itself.
   */
  fallbackDiscussionSegment?: string | null;
  /** The current route's `eventId` param; see `fallbackDiscussionSegment`. */
  fallbackEventSegment?: string | null;
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
  if (!comment.id && !comment.shortId) {
    return null;
  }

  const forumId = getCommentForumId(comment, options.fallbackForumId);
  const commentSegment = getCommentSegment({
    shortId: comment.shortId,
    commentId: comment.id,
  });

  const discussionNumber =
    comment.DiscussionChannel?.discussionNumber ??
    parseSlugSegmentNumber(options.fallbackDiscussionSegment ?? '');
  const discussionId =
    comment.DiscussionChannel?.discussionId ||
    options.fallbackDiscussionSegment;
  if ((discussionNumber != null || discussionId) && forumId) {
    return getDiscussionCommentRoute({
      forumId,
      discussionNumber,
      title: comment.DiscussionChannel?.Discussion?.title,
      discussionId,
      shortId: comment.shortId,
      commentId: comment.id,
    });
  }

  const eventChannel = comment.Event?.EventChannels?.[0];
  const eventNumber =
    eventChannel?.eventNumber ??
    parseSlugSegmentNumber(options.fallbackEventSegment ?? '');
  const eventId = comment.Event?.id || options.fallbackEventSegment;
  if ((eventNumber != null || eventId) && forumId) {
    return getEventCommentRoute({
      forumId,
      eventNumber,
      title: comment.Event?.title,
      eventId,
      shortId: comment.shortId,
      commentId: comment.id,
    });
  }

  const issueNumber =
    comment.Issue?.issueNumber || options.fallbackIssueNumber;
  if (issueNumber && forumId) {
    return {
      name: 'forums-forumId-issues-issueNumber-comments-commentId',
      params: {
        forumId,
        issueNumber,
        commentId: commentSegment,
      },
    };
  }

  return null;
}

type PermalinkMatchInput = {
  /** The route's `commentId` param (a comment shortId; raw id for legacy links). */
  routeCommentId: string | null | undefined;
  comment: { id?: string | null; shortId?: string | null } | null | undefined;
};

/**
 * Whether `comment` is the one a comment-permalink route points at. The route
 * carries the shortId; a raw id also matches so links built from data that
 * lacked a shortId keep highlighting.
 */
export function isPermalinkedComment({
  routeCommentId,
  comment,
}: PermalinkMatchInput): boolean {
  if (!routeCommentId || !comment) return false;
  return comment.shortId === routeCommentId || comment.id === routeCommentId;
}
