import { describe, expect, it } from 'vitest';
import {
  getAlbumUrl,
  getCollectionUrl,
  getDiscussionCommentRoute,
  getDiscussionCommentUrl,
  getDiscussionRoute,
  getDiscussionSegment,
  getDiscussionUrl,
  getDownloadUrl,
  getEventCommentUrl,
  getEventRoute,
  getEventUrl,
  getImageUrl,
} from './contentUrls';

describe('discussion links', () => {
  const target = {
    forumId: 'cats',
    discussionNumber: 42,
    title: 'Trail conditions',
  };

  it('builds the discussion url from number and slug', () => {
    expect(getDiscussionUrl(target)).toBe(
      '/forums/cats/discussions/42-trail-conditions'
    );
  });

  it('builds the download url on the downloads route', () => {
    expect(getDownloadUrl(target)).toBe(
      '/forums/cats/downloads/42-trail-conditions'
    );
  });

  it('carries the segment in the named route param', () => {
    expect(getDiscussionRoute(target)).toEqual({
      name: 'forums-forumId-discussions-discussionId',
      params: { forumId: 'cats', discussionId: '42-trail-conditions' },
    });
  });

  it('omits the slug for untitled discussions', () => {
    expect(getDiscussionSegment({ discussionNumber: 5, title: '' })).toBe('5');
  });

  it('falls back to the raw id when no number was loaded', () => {
    expect(
      getDiscussionSegment({ discussionNumber: null, discussionId: 'abc' })
    ).toBe('abc');
  });
});

describe('event links', () => {
  const target = { forumId: 'cats', eventNumber: 7, title: 'Saturday Cleanup' };

  it('builds the event url', () => {
    expect(getEventUrl(target)).toBe('/forums/cats/events/7-saturday-cleanup');
  });

  it('carries the segment in the named route param', () => {
    expect(getEventRoute(target)).toEqual({
      name: 'forums-forumId-events-eventId',
      params: { forumId: 'cats', eventId: '7-saturday-cleanup' },
    });
  });
});

describe('comment permalinks', () => {
  it('appends the shortId to the discussion url', () => {
    expect(
      getDiscussionCommentUrl({
        forumId: 'cats',
        discussionNumber: 42,
        title: 'Trail conditions',
        shortId: '4f3a9b2e1c7d',
      })
    ).toBe('/forums/cats/discussions/42-trail-conditions/comments/4f3a9b2e1c7d');
  });

  it('appends the shortId to the event url', () => {
    expect(
      getEventCommentUrl({
        forumId: 'cats',
        eventNumber: 7,
        title: 'Cleanup',
        shortId: 'abc123abc123',
      })
    ).toBe('/forums/cats/events/7-cleanup/comments/abc123abc123');
  });

  it('builds a named route whose commentId param is the shortId', () => {
    expect(
      getDiscussionCommentRoute({
        forumId: 'cats',
        discussionNumber: 42,
        title: 'T',
        shortId: 'sid',
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: { forumId: 'cats', discussionId: '42-t', commentId: 'sid' },
    });
  });
});

describe('user scoped links', () => {
  it('builds image urls from the per-user number', () => {
    expect(getImageUrl({ username: 'alice', imageNumber: 12 })).toBe(
      '/u/alice/images/12'
    );
  });

  it('builds album urls from the per-user number only', () => {
    expect(getAlbumUrl({ username: 'alice', albumNumber: 3 })).toBe(
      '/u/alice/albums/3'
    );
  });

  it('builds collection urls with a name slug', () => {
    expect(
      getCollectionUrl({
        username: 'alice',
        collectionNumber: 5,
        name: 'Nature Shots',
      })
    ).toBe('/u/alice/collections/5-nature-shots');
  });
});
