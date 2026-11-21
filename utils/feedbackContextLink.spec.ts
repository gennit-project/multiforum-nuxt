import { describe, it, expect } from 'vitest';
import { buildFeedbackContextLink } from './feedbackContextLink';

const DISCUSSION_ROUTE = 'forums-forumId-discussions-feedback-discussionId';
const PERMALINK_ROUTE =
  'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId';

describe('buildFeedbackContextLink', () => {
  it('returns empty while the discussion has not loaded', () => {
    expect(
      buildFeedbackContextLink({
        routeName: DISCUSSION_ROUTE,
        discussionId: 'd1',
        forumId: 'cats',
        hasDiscussion: false,
      })
    ).toBe('');
  });

  it('links back to the discussion on the discussion feedback route', () => {
    expect(
      buildFeedbackContextLink({
        routeName: DISCUSSION_ROUTE,
        discussionId: 'd1',
        forumId: 'cats',
        hasDiscussion: true,
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId',
      params: { discussionId: 'd1', forumId: 'cats' },
    });
  });

  it('links to the feedback comment permalink on the permalink route', () => {
    expect(
      buildFeedbackContextLink({
        routeName: PERMALINK_ROUTE,
        discussionId: 'd1',
        forumId: 'cats',
        hasDiscussion: true,
        contextFeedbackId: 'fb9',
      })
    ).toEqual({
      name: PERMALINK_ROUTE,
      params: { discussionId: 'd1', forumId: 'cats', feedbackId: 'fb9' },
    });
  });

  it('returns empty on the permalink route without a context feedback id', () => {
    expect(
      buildFeedbackContextLink({
        routeName: PERMALINK_ROUTE,
        discussionId: 'd1',
        forumId: 'cats',
        hasDiscussion: true,
        contextFeedbackId: null,
      })
    ).toBe('');
  });

  it('returns empty for an unrelated route', () => {
    expect(
      buildFeedbackContextLink({
        routeName: 'forums-forumId-discussions',
        discussionId: 'd1',
        forumId: 'cats',
        hasDiscussion: true,
      })
    ).toBe('');
  });

  it('passes the short-URL route segment through to the discussion link', () => {
    expect(
      buildFeedbackContextLink({
        routeName: DISCUSSION_ROUTE,
        discussionId: '42-trail-conditions',
        forumId: 'cats',
        hasDiscussion: true,
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId',
      params: { discussionId: '42-trail-conditions', forumId: 'cats' },
    });
  });

  it('rebuilds the discussion segment from the number and title when known', () => {
    expect(
      buildFeedbackContextLink({
        routeName: DISCUSSION_ROUTE,
        discussionId: 'ignored',
        discussionNumber: 42,
        discussionTitle: 'Trail Conditions',
        forumId: 'cats',
        hasDiscussion: true,
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId',
      params: { discussionId: '42-trail-conditions', forumId: 'cats' },
    });
  });

  it('uses the discussion number for the feedback permalink route too', () => {
    expect(
      buildFeedbackContextLink({
        routeName: PERMALINK_ROUTE,
        discussionId: 'ignored',
        discussionNumber: 42,
        forumId: 'cats',
        hasDiscussion: true,
        contextFeedbackId: 'fb9',
      })
    ).toEqual({
      name: PERMALINK_ROUTE,
      params: { discussionId: '42', forumId: 'cats', feedbackId: 'fb9' },
    });
  });
});
