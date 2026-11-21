import { describe, expect, it } from 'vitest';
import {
  getCommentForumId,
  getCommentPermalinkRoute,
  isPermalinkedComment,
} from './commentPermalink';

describe('comment permalink helpers', () => {
  it('builds discussion comment permalinks', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-1',
        DiscussionChannel: {
          channelUniqueName: 'sourceit',
          discussionId: 'discussion-1',
        },
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        forumId: 'sourceit',
        discussionId: 'discussion-1',
        commentId: 'comment-1',
      },
    });
  });

  it('builds event comment permalinks with event channel context', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-2',
        Event: {
          id: 'event-1',
          EventChannels: [{ channelUniqueName: 'events' }],
        },
      })
    ).toEqual({
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: {
        forumId: 'events',
        eventId: 'event-1',
        commentId: 'comment-2',
      },
    });
  });

  it('falls back to provided forum and event context', () => {
    expect(
      getCommentPermalinkRoute(
        {
          id: 'comment-3',
          Event: {
            id: 'event-2',
          },
        },
        { fallbackForumId: 'fallback-forum' }
      )
    ).toEqual({
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: {
        forumId: 'fallback-forum',
        eventId: 'event-2',
        commentId: 'comment-3',
      },
    });
  });

  it('builds issue comment permalinks', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-4',
        Channel: { uniqueName: 'support' },
        Issue: { issueNumber: 42 },
      })
    ).toEqual({
      name: 'forums-forumId-issues-issueNumber-comments-commentId',
      params: {
        forumId: 'support',
        issueNumber: 42,
        commentId: 'comment-4',
      },
    });
  });

  it('returns null when required context is missing', () => {
    expect(getCommentPermalinkRoute({ id: 'comment-5' })).toBeNull();
    expect(getCommentPermalinkRoute({ DiscussionChannel: {} })).toBeNull();
  });

  it('prefers direct channel context when resolving forum id', () => {
    expect(
      getCommentForumId(
        {
          Channel: { uniqueName: 'direct' },
          DiscussionChannel: { channelUniqueName: 'discussion' },
          Event: { EventChannels: [{ channelUniqueName: 'event' }] },
        },
        'fallback'
      )
    ).toBe('direct');
  });
});

describe('comment permalink short URLs', () => {
  it('builds discussion comment permalinks from the number, slug and shortId', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-1',
        shortId: 'a1b2c3d4e5f6',
        DiscussionChannel: {
          channelUniqueName: 'sourceit',
          discussionId: 'discussion-1',
          discussionNumber: 42,
          Discussion: { title: 'Trail Conditions' },
        },
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        forumId: 'sourceit',
        discussionId: '42-trail-conditions',
        commentId: 'a1b2c3d4e5f6',
      },
    });
  });

  it('builds event comment permalinks from the event number and shortId', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-2',
        shortId: 'f6e5d4c3b2a1',
        Event: {
          id: 'event-1',
          title: 'Spring Meetup',
          EventChannels: [{ channelUniqueName: 'events', eventNumber: 7 }],
        },
      })
    ).toEqual({
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: {
        forumId: 'events',
        eventId: '7-spring-meetup',
        commentId: 'f6e5d4c3b2a1',
      },
    });
  });

  it('reuses the route discussion segment when the comment lacks a number', () => {
    expect(
      getCommentPermalinkRoute(
        { id: 'comment-3', shortId: 'abc123abc123' },
        {
          fallbackForumId: 'cats',
          fallbackDiscussionSegment: '9-some-discussion',
        }
      )
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        forumId: 'cats',
        discussionId: '9',
        commentId: 'abc123abc123',
      },
    });
  });

  it('uses the shortId for issue comment permalinks', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-4',
        shortId: 'issueshort01',
        Channel: { uniqueName: 'support' },
        Issue: { issueNumber: 42 },
      })
    ).toEqual({
      name: 'forums-forumId-issues-issueNumber-comments-commentId',
      params: {
        forumId: 'support',
        issueNumber: 42,
        commentId: 'issueshort01',
      },
    });
  });

  it('falls back to the raw ids when no numbers or shortId are selected', () => {
    expect(
      getCommentPermalinkRoute({
        id: 'comment-5',
        DiscussionChannel: {
          channelUniqueName: 'sourceit',
          discussionId: 'discussion-5',
        },
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: {
        forumId: 'sourceit',
        discussionId: 'discussion-5',
        commentId: 'comment-5',
      },
    });
  });
});

describe('isPermalinkedComment', () => {
  it.each([
    ['matches the shortId', 'short1', { id: 'c1', shortId: 'short1' }, true],
    ['matches a raw id (legacy links)', 'c1', { id: 'c1', shortId: 'short1' }, true],
    ['rejects a different comment', 'other', { id: 'c1', shortId: 'short1' }, false],
    ['rejects an empty route id', '', { id: 'c1', shortId: 'short1' }, false],
    ['rejects a missing comment', 'short1', null, false],
  ])('%s', (_label, routeCommentId, comment, expected) => {
    expect(isPermalinkedComment({ routeCommentId, comment })).toBe(expected);
  });
});
