/**
 * Pure builder for the "back to context" link on the discussion feedback page.
 * Where the link points depends on the active route: feedback collected on a
 * discussion links back to the discussion; feedback collected on a feedback
 * comment links back to that comment's permalink. Extracted from
 * discussions/feedback/[discussionId].vue so the routing logic is testable.
 *
 * The discussion route param is the short-URL segment (`{number}-{slug}`), so
 * the links carry it through; when a caller has the number/title instead it is
 * rebuilt via the shared content URL helpers.
 */
import { getDiscussionRoute, getDiscussionSegment } from '@/utils/contentUrls';

export type FeedbackContextLink =
  | { name: string; params: Record<string, unknown> }
  | '';

export type BuildFeedbackContextLinkParams = {
  routeName: string | null | undefined;
  /** The discussion route segment (`{number}-{slug}`) or raw id fallback. */
  discussionId: unknown;
  /** When known, takes precedence over `discussionId`. */
  discussionNumber?: number | null;
  discussionTitle?: string | null;
  forumId: unknown;
  /** Whether the discussion has loaded (no link until it has). */
  hasDiscussion: boolean;
  /** Id of the comment the feedback is about, when on a feedback-permalink route. */
  contextFeedbackId?: string | null;
};

export function buildFeedbackContextLink(
  params: BuildFeedbackContextLinkParams
): FeedbackContextLink {
  const { routeName, forumId, hasDiscussion, contextFeedbackId } = params;
  const discussionTarget = {
    forumId: String(forumId),
    discussionNumber: params.discussionNumber,
    title: params.discussionTitle,
    discussionId:
      typeof params.discussionId === 'string' ? params.discussionId : '',
  };
  const discussionId = getDiscussionSegment(discussionTarget);

  if (!hasDiscussion) return '';

  // Feedback on a discussion -> back to the discussion page.
  if (routeName === 'forums-forumId-discussions-feedback-discussionId') {
    return getDiscussionRoute(discussionTarget);
  }

  // Feedback on a feedback comment -> back to that comment's permalink.
  if (
    routeName ===
    'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId'
  ) {
    if (!contextFeedbackId) return '';
    return {
      name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
      params: { discussionId, forumId, feedbackId: contextFeedbackId },
    };
  }

  return '';
}
