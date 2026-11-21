import { describe, it, expect } from 'vitest';
import {
  getCommentPermalink,
  getCommentContextPermalink,
  getCommentContextTitle,
  getCommentContextType,
  getCommentAuthorInfo,
} from './commentUtils';

describe('getCommentPermalink', () => {
  it('links to a discussion comment for a non-download discussion channel', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        DiscussionChannel: { channelUniqueName: 'cats', discussionId: 'd1' },
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId-comments-commentId',
      params: { forumId: 'cats', discussionId: 'd1', commentId: 'c1' },
    });
  });

  it('links to a download comment when the discussion hasDownload', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          Discussion: { hasDownload: true },
        },
      }).name
    ).toBe('forums-forumId-downloads-discussionId-comments-commentId');
  });

  it('links to a channel comment for a channel-scoped comment', () => {
    expect(
      getCommentPermalink({ id: 'c1', Channel: { uniqueName: 'cats' } }).name
    ).toBe('forums-forumId-comments-commentId');
  });

  it('links to an event comment using the first event channel', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        Event: { id: 'e1', EventChannels: [{ channelUniqueName: 'cats' }] },
      })
    ).toEqual({
      name: 'forums-forumId-events-eventId-comments-commentId',
      params: { forumId: 'cats', eventId: 'e1', commentId: 'c1' },
    });
  });

  it('falls back to the home route when there is no context', () => {
    expect(getCommentPermalink({ id: 'c1' })).toEqual({ name: 'index' });
  });
});

describe('getCommentPermalink short URLs', () => {
  it('links to a discussion comment by number, slug and shortId', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        shortId: 'a1b2c3d4e5f6',
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          discussionNumber: 42,
          Discussion: { title: 'Trail Conditions' },
        },
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

  it('links to a download comment by number and shortId', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        shortId: 'a1b2c3d4e5f6',
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          discussionNumber: 3,
          Discussion: { hasDownload: true, title: 'Cool Mod' },
        },
      })
    ).toEqual({
      name: 'forums-forumId-downloads-discussionId-comments-commentId',
      params: {
        forumId: 'cats',
        discussionId: '3-cool-mod',
        commentId: 'a1b2c3d4e5f6',
      },
    });
  });

  it('links to an event comment by event number, slug and shortId', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        shortId: 'f6e5d4c3b2a1',
        Event: {
          id: 'e1',
          title: 'Spring Meetup',
          EventChannels: [{ channelUniqueName: 'cats', eventNumber: 7 }],
        },
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

  it('uses a number-only discussion segment when no title is available', () => {
    expect(
      getCommentPermalink({
        id: 'c1',
        shortId: 'a1b2c3d4e5f6',
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          discussionNumber: 42,
        },
      }).params?.discussionId
    ).toBe('42');
  });
});

describe('getCommentContextPermalink short URLs', () => {
  it('links to the parent discussion by number and slug', () => {
    expect(
      getCommentContextPermalink({
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          discussionNumber: 42,
          Discussion: { title: 'Trail Conditions' },
        },
      })
    ).toEqual({
      name: 'forums-forumId-discussions-discussionId',
      params: { forumId: 'cats', discussionId: '42-trail-conditions' },
    });
  });

  it('links to the parent download by number', () => {
    expect(
      getCommentContextPermalink({
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          discussionNumber: 3,
          Discussion: { hasDownload: true },
        },
      })
    ).toEqual({
      name: 'forums-forumId-downloads-discussionId',
      params: { forumId: 'cats', discussionId: '3' },
    });
  });

  it('links to the parent event by number and slug', () => {
    expect(
      getCommentContextPermalink({
        Event: {
          id: 'e1',
          title: 'Spring Meetup',
          EventChannels: [{ channelUniqueName: 'cats', eventNumber: 7 }],
        },
      })
    ).toEqual({
      name: 'forums-forumId-events-eventId',
      params: { forumId: 'cats', eventId: '7-spring-meetup' },
    });
  });
});

describe('getCommentContextPermalink', () => {
  it('links to the parent discussion', () => {
    expect(
      getCommentContextPermalink({
        DiscussionChannel: { channelUniqueName: 'cats', discussionId: 'd1' },
      }).name
    ).toBe('forums-forumId-discussions-discussionId');
  });

  it('links to the parent download when hasDownload', () => {
    expect(
      getCommentContextPermalink({
        DiscussionChannel: {
          channelUniqueName: 'cats',
          discussionId: 'd1',
          Discussion: { hasDownload: true },
        },
      }).name
    ).toBe('forums-forumId-downloads-discussionId');
  });

  it('falls back to the home route when there is no context', () => {
    expect(getCommentContextPermalink({})).toEqual({ name: 'index' });
  });
});

describe('getCommentContextTitle', () => {
  it('uses the discussion title when present', () => {
    expect(
      getCommentContextTitle({
        DiscussionChannel: { Discussion: { title: 'My Discussion' } },
      })
    ).toBe('My Discussion');
  });

  it('falls back to "Unknown" with no recognizable context', () => {
    expect(getCommentContextTitle({})).toBe('Unknown');
  });
});

describe('getCommentContextType', () => {
  it.each([
    [{ DiscussionChannel: {} }, 'Discussion'],
    [
      { DiscussionChannel: { Discussion: { hasDownload: true } } },
      'Download',
    ],
    [{ Channel: {} }, 'Forum'],
    [{ Event: {} }, 'Event'],
    [{}, 'Unknown'],
  ])('classifies %o as %s', (comment, expected) => {
    expect(getCommentContextType(comment)).toBe(expected);
  });
});

describe('getCommentAuthorInfo', () => {
  it('returns null when there is no author', () => {
    expect(getCommentAuthorInfo({ CommentAuthor: null })).toBeNull();
  });

  it('flags a server-admin User author', () => {
    expect(
      getCommentAuthorInfo(
        { CommentAuthor: { __typename: 'User', username: 'alice' } },
        { serverAdminUsernames: ['alice'] }
      )?.isAdmin
    ).toBe(true);
  });

  it('marks a ModerationProfile author as such', () => {
    expect(
      getCommentAuthorInfo({
        CommentAuthor: { __typename: 'ModerationProfile', displayName: 'Mod' },
      })?.isModerationProfile
    ).toBe(true);
  });

  it('returns null for an unrecognized author typename', () => {
    expect(
      getCommentAuthorInfo({
        CommentAuthor: { __typename: 'Robot', username: 'x' },
      })
    ).toBeNull();
  });
});
