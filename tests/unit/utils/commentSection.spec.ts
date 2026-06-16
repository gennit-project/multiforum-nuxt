import { describe, it, expect } from 'vitest';
import {
  filterCommentsBySearch,
  resolveChannelUniqueName,
} from '@/utils/commentSection';

describe('filterCommentsBySearch', () => {
  const comments = [
    { text: 'Hello world' },
    { text: 'Goodbye' },
    { text: null },
  ];

  it('returns all comments when the search text is empty', () => {
    expect(filterCommentsBySearch({ comments, searchText: '  ' })).toEqual(
      comments
    );
  });

  it('filters comments by a case-insensitive text match', () => {
    expect(
      filterCommentsBySearch({ comments, searchText: 'WORLD' })
    ).toEqual([{ text: 'Hello world' }]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterCommentsBySearch({ comments, searchText: 'zzz' })).toEqual([]);
  });

  it('handles a null comments list', () => {
    expect(
      filterCommentsBySearch({ comments: null, searchText: 'x' })
    ).toEqual([]);
  });
});

describe('resolveChannelUniqueName', () => {
  it('prefers the explicit channel name', () => {
    expect(
      resolveChannelUniqueName({
        comments: [{ id: '1', Channel: { uniqueName: 'dogs' } }],
        explicitChannelUniqueName: 'cats',
      })
    ).toBe('cats');
  });

  it('falls back to the first comment DiscussionChannel name', () => {
    expect(
      resolveChannelUniqueName({
        comments: [
          { id: '1', DiscussionChannel: { channelUniqueName: 'cats' } },
        ],
      })
    ).toBe('cats');
  });

  it('falls back to the first comment Channel name', () => {
    expect(
      resolveChannelUniqueName({
        comments: [{ id: '1', Channel: { uniqueName: 'dogs' } }],
      })
    ).toBe('dogs');
  });

  it('skips comments without an id when finding the fallback', () => {
    expect(
      resolveChannelUniqueName({
        comments: [
          { Channel: { uniqueName: 'ignored' } },
          { id: '2', Channel: { uniqueName: 'cats' } },
        ],
      })
    ).toBe('cats');
  });

  it('returns an empty string when nothing resolves', () => {
    expect(resolveChannelUniqueName({ comments: [] })).toBe('');
  });
});
