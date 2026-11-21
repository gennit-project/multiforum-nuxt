import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import {
  getPermalinkToDiscussionComment,
  getPermalinkToDiscussion,
  getPermalinkToEventComment,
  getPermalinkToEvent,
  getFeedbackPermalinkObject,
  updateFilters,
} from '@/utils/routerUtils';

// Mock console.error to prevent log pollution during tests
const originalConsoleError = console.error;
console.error = vi.fn();

describe('routerUtils', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console.error after all tests
    console.error = originalConsoleError;
  });

  describe('getPermalinkToDiscussionComment', () => {
    it('returns the correct permalink object for a discussion comment', () => {
      const input = {
        forumId: 'forum-123',
        discussionId: 'discussion-456',
        commentId: 'comment-789',
      };

      const result = getPermalinkToDiscussionComment(input);

      expect(result).toEqual({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          forumId: 'forum-123',
          discussionId: 'discussion-456',
          commentId: 'comment-789',
        },
      });
    });
  });

  describe('getPermalinkToDiscussion', () => {
    it('returns the correct permalink object for a discussion', () => {
      const input = {
        forumId: 'forum-123',
        discussionId: 'discussion-456',
      };

      const result = getPermalinkToDiscussion(input);

      expect(result).toEqual({
        name: 'forums-forumId-discussions-discussionId',
        params: {
          forumId: 'forum-123',
          discussionId: 'discussion-456',
        },
      });
    });
  });

  describe('getPermalinkToEventComment', () => {
    it('returns the correct permalink object for an event comment', () => {
      const input = {
        forumId: 'forum-123',
        eventId: 'event-456',
        commentId: 'comment-789',
      };

      const result = getPermalinkToEventComment(input);

      expect(result).toEqual({
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          forumId: 'forum-123',
          eventId: 'event-456',
          commentId: 'comment-789',
        },
      });
    });
  });

  describe('getPermalinkToEvent', () => {
    it('returns the correct permalink object for an event', () => {
      const input = {
        forumId: 'forum-123',
        eventId: 'event-456',
      };

      const result = getPermalinkToEvent(input);

      expect(result).toEqual({
        name: 'forums-forumId-events-eventId',
        params: {
          forumId: 'forum-123',
          eventId: 'event-456',
        },
      });
    });
  });

  describe('getFeedbackPermalinkObject', () => {
    it('returns permalink for feedback on a discussion', () => {
      const input = {
        routeName: 'forums-forumId-discussions-feedback-discussionId',
        forumId: 'forum-123',
        commentId: 'feedback-789',
        GivesFeedbackOnDiscussion: {
          id: 'discussion-456',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toEqual({
        name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'forum-123',
          discussionId: 'discussion-456',
          feedbackId: 'feedback-789',
        },
      });
    });

    it('returns permalink for feedback on a discussion by checking object reference', () => {
      const input = {
        routeName: 'some-other-route',
        forumId: 'forum-123',
        commentId: 'feedback-789',
        GivesFeedbackOnDiscussion: {
          id: 'discussion-456',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toEqual({
        name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'forum-123',
          discussionId: 'discussion-456',
          feedbackId: 'feedback-789',
        },
      });
    });

    it('returns permalink for feedback on an event', () => {
      const input = {
        routeName: 'forums-forumId-events-feedback-eventId',
        forumId: 'forum-123',
        commentId: 'feedback-789',
        GivesFeedbackOnEvent: {
          id: 'event-456',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toEqual({
        name: 'forums-forumId-events-feedback-eventId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'forum-123',
          eventId: 'event-456',
          feedbackId: 'feedback-789',
        },
      });
    });

    it('returns permalink for feedback on an event by checking object reference', () => {
      const input = {
        routeName: 'some-other-route',
        forumId: 'forum-123',
        commentId: 'feedback-789',
        GivesFeedbackOnEvent: {
          id: 'event-456',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toEqual({
        name: 'forums-forumId-events-feedback-eventId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'forum-123',
          eventId: 'event-456',
          feedbackId: 'feedback-789',
        },
      });
    });

    it('returns permalink for feedback on a discussion comment', () => {
      const input = {
        routeName: 'some-route',
        forumId: 'forum-123',
        discussionId: 'discussion-456',
        commentId: 'feedback-789',
        GivesFeedbackOnComment: {
          id: 'comment-123',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toEqual({
        name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'forum-123',
          discussionId: 'discussion-456',
          commentId: 'comment-123',
          feedbackId: 'feedback-789',
        },
      });
    });

    it('returns empty object when no discussion ID is provided for comment feedback', () => {
      const input = {
        routeName: 'some-route',
        forumId: 'forum-123',
        discussionId: undefined,
        commentId: 'feedback-789',
        GivesFeedbackOnComment: {
          id: 'comment-123',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toEqual({});
    });

    it('returns null when missing required parameters for discussion feedback', () => {
      const input = {
        routeName: 'forums-forumId-discussions-feedback-discussionId',
        forumId: 'forum-123',
        // missing commentId
        GivesFeedbackOnDiscussion: {
          id: 'discussion-456',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toBeNull();
    });

    it('returns null when missing required parameters for event feedback', () => {
      const input = {
        routeName: 'forums-forumId-events-feedback-eventId',
        forumId: 'forum-123',
        // missing commentId
        GivesFeedbackOnEvent: {
          id: 'event-456',
        } as any,
      };

      const result = getFeedbackPermalinkObject(input);

      expect(result).toBeNull();
    });

    it('returns null when missing required parameters for comment feedback', () => {
      const input = {
        routeName: 'some-route',
        forumId: 'forum-123',
        // missing commentId
        discussionId: 'discussion-456',
        GivesFeedbackOnComment: {
          id: 'comment-123',
        } as any,
      };

      const result = getFeedbackPermalinkObject({
        ...input,
        commentId: undefined,
      });

      expect(result).toBeNull();
    });
  });

  describe('short URL permalinks', () => {
    it('builds a discussion comment permalink from the number, title and shortId', () => {
      expect(
        getPermalinkToDiscussionComment({
          forumId: 'cats',
          discussionNumber: 42,
          discussionTitle: 'Trail Conditions',
          shortId: 'a1b2c3d4e5f6',
        })
      ).toEqual({
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          forumId: 'cats',
          discussionId: '42-trail-conditions',
          commentId: 'a1b2c3d4e5f6',
        },
      });
    });

    it('builds a discussion permalink from the number and title', () => {
      expect(
        getPermalinkToDiscussion({
          forumId: 'cats',
          discussionNumber: 42,
          discussionTitle: 'Trail Conditions',
        })
      ).toEqual({
        name: 'forums-forumId-discussions-discussionId',
        params: { forumId: 'cats', discussionId: '42-trail-conditions' },
      });
    });

    it('builds an event comment permalink from the number, title and shortId', () => {
      expect(
        getPermalinkToEventComment({
          forumId: 'cats',
          eventNumber: 7,
          eventTitle: 'Spring Meetup',
          shortId: 'f6e5d4c3b2a1',
        })
      ).toEqual({
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          forumId: 'cats',
          eventId: '7-spring-meetup',
          commentId: 'f6e5d4c3b2a1',
        },
      });
    });

    it('builds an event permalink from the number and title', () => {
      expect(
        getPermalinkToEvent({
          forumId: 'cats',
          eventNumber: 7,
          eventTitle: 'Spring Meetup',
        })
      ).toEqual({
        name: 'forums-forumId-events-eventId',
        params: { forumId: 'cats', eventId: '7-spring-meetup' },
      });
    });

    it('prefers the shortId over the raw comment id', () => {
      expect(
        getPermalinkToDiscussionComment({
          forumId: 'cats',
          discussionNumber: 1,
          shortId: 'short',
          commentId: 'raw-id',
        }).params.commentId
      ).toBe('short');
    });

    it('builds feedback-on-discussion permalinks from the discussion number', () => {
      expect(
        getFeedbackPermalinkObject({
          routeName: 'forums-forumId-discussions-feedback-discussionId',
          forumId: 'cats',
          commentId: 'feedback-1',
          discussionNumber: 42,
          discussionTitle: 'Trail Conditions',
          GivesFeedbackOnDiscussion: { id: 'discussion-raw' } as any,
        })
      ).toEqual({
        name: 'forums-forumId-discussions-feedback-discussionId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'cats',
          discussionId: '42-trail-conditions',
          feedbackId: 'feedback-1',
        },
      });
    });

    it('reuses the route discussion segment for feedback permalinks without a number', () => {
      expect(
        getFeedbackPermalinkObject({
          routeName: 'forums-forumId-discussions-feedback-discussionId',
          forumId: 'cats',
          commentId: 'feedback-1',
          discussionId: '42-trail-conditions',
          GivesFeedbackOnDiscussion: { id: 'discussion-raw' } as any,
        })?.params?.discussionId
      ).toBe('42-trail-conditions');
    });

    it('builds feedback-on-event permalinks from the event number', () => {
      expect(
        getFeedbackPermalinkObject({
          routeName: 'forums-forumId-events-feedback-eventId',
          forumId: 'cats',
          commentId: 'feedback-1',
          eventNumber: 7,
          eventTitle: 'Spring Meetup',
          GivesFeedbackOnEvent: { id: 'event-raw' } as any,
        })?.params?.eventId
      ).toBe('7-spring-meetup');
    });

    it('builds feedback-on-comment permalinks with the discussion segment and raw comment id', () => {
      expect(
        getFeedbackPermalinkObject({
          routeName: 'forums-forumId-discussions-discussionId',
          forumId: 'cats',
          commentId: 'feedback-1',
          discussionNumber: 42,
          GivesFeedbackOnComment: { id: 'commented-on-1' } as any,
        })
      ).toEqual({
        name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId-feedbackPermalink-feedbackId',
        params: {
          forumId: 'cats',
          discussionId: '42',
          commentId: 'commented-on-1',
          feedbackId: 'feedback-1',
        },
      });
    });
  });

  describe('updateFilters', () => {
    it('updates query parameters correctly and calls router.replace', () => {
      const mockRouter = {
        replace: vi.fn(),
      };

      const mockRoute = {
        path: '/events',
        query: {
          existingParam: 'value',
          shouldBeRemoved: 'value',
        },
      };

      const params = {
        channels: ['channel-1', 'channel-2'],
        tags: ['tag-1', 'tag-2'],
        searchInput: 'test search',
        radius: 10,
        // This empty array should remove the parameter
        shouldBeRemoved: [],
      };

      updateFilters({
        params,
        router: mockRouter as any,
        route: mockRoute,
      });

      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/events',
        query: {
          existingParam: 'value',
          channels: ['channel-1', 'channel-2'],
          tags: ['tag-1', 'tag-2'],
          searchInput: 'test search',
          radius: 10,
        },
        force: true,
      });
    });

    it('removes parameters with empty values', () => {
      const mockRouter = {
        replace: vi.fn(),
      };

      const mockRoute = {
        path: '/events',
        query: {
          existingParam: 'value',
          channels: ['old-channel'],
          emptyString: 'should-be-removed',
          emptyArray: ['should', 'be', 'removed'],
          undefinedValue: 'should-be-removed',
        },
      };

      const params = {
        // These should remove the corresponding parameters
        searchInput: '',
        tags: undefined,
        emptyString: '',
        emptyArray: [],
        undefinedValue: undefined,
      };

      updateFilters({
        params,
        router: mockRouter as any,
        route: mockRoute,
      });

      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/events',
        query: {
          existingParam: 'value',
          channels: ['old-channel'],
        },
        force: true,
      });
    });

    it('handles numeric and boolean values correctly', () => {
      const mockRouter = {
        replace: vi.fn(),
      };

      const mockRoute = {
        path: '/events',
        query: {},
      };

      const params = {
        latitude: 12.345,
        longitude: 67.89,
        radius: 10,
        showCanceledEvents: true,
        showOnlyFreeEvents: false,
      };

      updateFilters({
        params,
        router: mockRouter as any,
        route: mockRoute,
      });

      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/events',
        query: {
          latitude: 12.345,
          longitude: 67.89,
          radius: 10,
          showCanceledEvents: true,
          showOnlyFreeEvents: false,
        },
        force: true,
      });
    });

    it('preserves parameters that are not included in the update', () => {
      const mockRouter = {
        replace: vi.fn(),
      };

      const mockRoute = {
        path: '/events',
        query: {
          existingParam: 'value',
          anotherParam: 'keep me',
        },
      };

      const params = {
        searchInput: 'new search',
      };

      updateFilters({
        params,
        router: mockRouter as any,
        route: mockRoute,
      });

      expect(mockRouter.replace).toHaveBeenCalledWith({
        path: '/events',
        query: {
          existingParam: 'value',
          anotherParam: 'keep me',
          searchInput: 'new search',
        },
        force: true,
      });
    });
  });
});
