import { describe, it, expect } from 'vitest';
import {
  getChannelsFromQuery,
  buildCommentSearchWhere,
  getCommentAuthorUsername,
  getCommentAuthorDisplayName,
  getCommentAuthorProfilePic,
} from './commentSearch';

describe('getChannelsFromQuery', () => {
  it('wraps a single string value in an array', () => {
    expect(getChannelsFromQuery('cats')).toEqual(['cats']);
  });

  it('keeps only string entries from an array', () => {
    expect(getChannelsFromQuery(['cats', null, 'dogs'])).toEqual([
      'cats',
      'dogs',
    ]);
  });

  it('returns an empty array for missing channels', () => {
    expect(getChannelsFromQuery(undefined)).toEqual([]);
  });
});

describe('buildCommentSearchWhere', () => {
  it('always excludes feedback and issue comments', () => {
    const where = buildCommentSearchWhere({
      searchInput: '',
      selectedChannels: [],
    });
    expect(where).toMatchObject({ isFeedbackComment_NOT: true, Issue: null });
  });

  it('adds a case-insensitive text match for the search term', () => {
    const where = buildCommentSearchWhere({
      searchInput: 'hello',
      selectedChannels: [],
    });
    expect(where.text_MATCHES).toBe('(?i).*hello.*');
  });

  it('escapes regex metacharacters in the search term', () => {
    const where = buildCommentSearchWhere({
      searchInput: 'a.b(c)',
      selectedChannels: [],
    });
    expect(where.text_MATCHES).toBe('(?i).*a\\.b\\(c\\).*');
  });

  it('omits the text match for a blank search', () => {
    const where = buildCommentSearchWhere({
      searchInput: '   ',
      selectedChannels: [],
    });
    expect('text_MATCHES' in where).toBe(false);
  });

  it('adds a discussion+event channel filter when channels are selected', () => {
    const where = buildCommentSearchWhere({
      searchInput: '',
      selectedChannels: ['cats'],
    });
    expect(where.OR).toEqual([
      { DiscussionChannel: { channelUniqueName_IN: ['cats'] } },
      { Event: { EventChannels_SOME: { channelUniqueName_IN: ['cats'] } } },
    ]);
  });

  it('omits the channel filter when none are selected', () => {
    const where = buildCommentSearchWhere({
      searchInput: 'hi',
      selectedChannels: [],
    });
    expect('OR' in where).toBe(false);
  });
});

describe('comment author resolvers', () => {
  it('reads the username from a User author', () => {
    expect(
      getCommentAuthorUsername({
        CommentAuthor: { __typename: 'User', username: 'alice' },
      })
    ).toBe('alice');
  });

  it('reads the display name from a moderation profile author', () => {
    expect(
      getCommentAuthorUsername({
        CommentAuthor: { __typename: 'ModerationProfile', displayName: 'modBob' },
      })
    ).toBe('modBob');
  });

  it('falls back to Unknown when there is no author', () => {
    expect(getCommentAuthorUsername(null)).toBe('Unknown');
  });

  it('prefers displayName then username for the display name', () => {
    expect(
      getCommentAuthorDisplayName({
        CommentAuthor: { __typename: 'User', username: 'alice', displayName: '' },
      })
    ).toBe('alice');
  });

  it('returns the profile pic only for User authors', () => {
    expect(
      getCommentAuthorProfilePic({
        CommentAuthor: { __typename: 'User', profilePicURL: 'p.png' },
      })
    ).toBe('p.png');
  });

  it('returns an empty profile pic for moderation profiles', () => {
    expect(
      getCommentAuthorProfilePic({
        CommentAuthor: { __typename: 'ModerationProfile', displayName: 'm' },
      })
    ).toBe('');
  });
});
