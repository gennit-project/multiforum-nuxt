import { describe, it, expect } from 'vitest';
import {
  formatCount,
  getDiscussionLink,
  getDownloadLink,
  getChannelLink,
  getTotalCommentCount,
  buildFavoriteAuthorInfo,
} from './favoriteDiscussionDisplay';

describe('formatCount', () => {
  it('uses the singular noun for a count of one', () => {
    expect(formatCount(1, 'comment', 'comments')).toBe('1 comment');
  });

  it('uses the plural noun for other counts', () => {
    expect(formatCount(3, 'comment', 'comments')).toBe('3 comments');
  });

  it('treats an undefined count as zero (plural)', () => {
    expect(formatCount(undefined, 'comment', 'comments')).toBe('0 comments');
  });
});

describe('getDiscussionLink', () => {
  it('links to the discussion under its first forum', () => {
    expect(
      getDiscussionLink({
        id: 'd1',
        DiscussionChannels: [{ channelUniqueName: 'cats' }],
      })
    ).toBe('/forums/cats/discussions/d1');
  });

  it('falls back to root when there is no forum channel', () => {
    expect(getDiscussionLink({ id: 'd1', DiscussionChannels: [] })).toBe('/');
  });
});

describe('getDownloadLink', () => {
  it('links to the download under its first forum', () => {
    expect(
      getDownloadLink({
        id: 'd1',
        DiscussionChannels: [{ channelUniqueName: 'cats' }],
      })
    ).toBe('/forums/cats/downloads/d1');
  });

  it('falls back to root when there is no forum channel', () => {
    expect(getDownloadLink({ id: 'd1', DiscussionChannels: [] })).toBe('/');
  });
});

describe('getChannelLink', () => {
  it('links to the forum', () => {
    expect(getChannelLink('cats')).toBe('/forums/cats');
  });

  it('falls back to root for a missing channel name', () => {
    expect(getChannelLink(null)).toBe('/');
  });
});

describe('getTotalCommentCount', () => {
  it('sums comment counts across all channels', () => {
    expect(
      getTotalCommentCount([
        { CommentsAggregate: { count: 2 } },
        { CommentsAggregate: { count: 3 } },
      ])
    ).toBe(5);
  });

  it('treats missing aggregates as zero', () => {
    expect(getTotalCommentCount([{}, { CommentsAggregate: { count: 4 } }])).toBe(
      4
    );
  });

  it('returns 0 for no channels', () => {
    expect(getTotalCommentCount(null)).toBe(0);
  });
});

describe('buildFavoriteAuthorInfo', () => {
  it('returns null for a deleted (absent) author', () => {
    expect(
      buildFavoriteAuthorInfo({ author: null, adminUsernames: [] })
    ).toBeNull();
  });

  it('flags the author as admin when they are a server admin', () => {
    const info = buildFavoriteAuthorInfo({
      author: { username: 'alice' },
      adminUsernames: ['alice'],
    });
    expect(info?.isAdmin).toBe(true);
  });

  it('does not flag non-admins', () => {
    const info = buildFavoriteAuthorInfo({
      author: { username: 'bob' },
      adminUsernames: ['alice'],
    });
    expect(info?.isAdmin).toBe(false);
  });

  it('defaults missing karma fields to zero', () => {
    const info = buildFavoriteAuthorInfo({
      author: { username: 'bob' },
      adminUsernames: [],
    });
    expect(info?.commentKarma).toBe(0);
  });
});
