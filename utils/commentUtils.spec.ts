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
