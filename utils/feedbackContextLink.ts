/**
 * Pure builder for the "back to context" link on the discussion feedback page.
 * Where the link points depends on the active route: feedback collected on a
 * discussion links back to the discussion; feedback collected on a feedback
 * comment links back to that comment's permalink. Extracted from
 * discussions/feedback/[discussionId].vue so the routing logic is testable.
 */

export type FeedbackContextLink =
  | { name: string; params: Record<string, unknown> }
  | '';

export type BuildFeedbackContextLinkParams = {
  routeName: string | null | undefined;
  discussionId: unknown;
  forumId: unknown;
  /** Whether the discussion has loaded (no link until it has). */
  hasDiscussion: boolean;
  /** Id of the comment the feedback is about, when on a feedback-permalink route. */
  contextFeedbackId?: string | null;
};

export function buildFeedbackContextLink(
  params: BuildFeedbackContextLinkParams
): FeedbackContextLink {
  const { routeName, discussionId, forumId, hasDiscussion, contextFeedbackId } =
    params;

  if (!hasDiscussion) return '';

  // Feedback on a discussion -> back to the discussion page.
  if (routeName === 'forums-forumId-discussions-feedback-discussionId') {
    return {
      name: 'forums-forumId-discussions-discussionId',
      params: { discussionId, forumId },
    };
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
