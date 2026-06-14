import { describe, expect, it } from 'vitest';
import {
  getCommentForumId,
  getCommentPermalinkRoute,
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
