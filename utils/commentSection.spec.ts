import { describe, it, expect } from 'vitest';
import {
  filterCommentsBySearch,
  resolveChannelUniqueName,
  shouldSoftDeleteComment,
  getCommentInProgressLength,
  buildReplyCommentInput,
} from './commentSection';

describe('filterCommentsBySearch', () => {
  const comments = [
    { text: 'Hello world' },
    { text: 'Goodbye' },
    { text: null },
  ];

  it('returns all comments when the search term is empty', () => {
    expect(filterCommentsBySearch({ comments, searchText: '  ' })).toHaveLength(
      3
    );
  });

  it('matches case-insensitively on comment text', () => {
    expect(
      filterCommentsBySearch({ comments, searchText: 'HELLO' })
    ).toEqual([{ text: 'Hello world' }]);
  });

  it('excludes comments with no text when filtering', () => {
    expect(filterCommentsBySearch({ comments, searchText: 'o' })).toHaveLength(
      2
    );
  });

  it('returns an empty array when comments is null', () => {
    expect(filterCommentsBySearch({ comments: null, searchText: 'x' })).toEqual(
      []
    );
  });
});

describe('resolveChannelUniqueName', () => {
  it('prefers the explicit channel name', () => {
    expect(
      resolveChannelUniqueName({
        comments: [],
        explicitChannelUniqueName: 'cats',
      })
    ).toBe('cats');
  });

  it('falls back to the first comment DiscussionChannel name', () => {
    expect(
      resolveChannelUniqueName({
        comments: [{ id: '1', DiscussionChannel: { channelUniqueName: 'dogs' } }],
      })
    ).toBe('dogs');
  });

  it('falls back to the Channel uniqueName when no discussion channel', () => {
    expect(
      resolveChannelUniqueName({
        comments: [{ id: '1', Channel: { uniqueName: 'birds' } }],
      })
    ).toBe('birds');
  });

  it('returns an empty string when nothing resolves', () => {
    expect(resolveChannelUniqueName({ comments: [] })).toBe('');
  });
});

describe('shouldSoftDeleteComment', () => {
  it('soft deletes when the comment has replies', () => {
    expect(shouldSoftDeleteComment(2)).toBe(true);
  });

  it('hard deletes a leaf comment', () => {
    expect(shouldSoftDeleteComment(0)).toBe(false);
  });
});

describe('getCommentInProgressLength', () => {
  it('uses the edit text length when an edit form is open', () => {
    expect(
      getCommentInProgressLength({
        editFormOpen: true,
        editText: 'hello',
        replyFormOpen: true,
        createText: 'much longer reply',
      })
    ).toBe(5);
  });

  it('uses the create text length when only a reply form is open', () => {
    expect(
      getCommentInProgressLength({
        editFormOpen: false,
        editText: '',
        replyFormOpen: true,
        createText: 'reply',
      })
    ).toBe(5);
  });

  it('returns 0 when no form is open', () => {
    expect(
      getCommentInProgressLength({
        editFormOpen: false,
        editText: 'ignored',
        replyFormOpen: false,
        createText: 'ignored',
      })
    ).toBe(0);
  });

  it('returns 0 when the reply form is open but create text is empty', () => {
    expect(
      getCommentInProgressLength({
        editFormOpen: false,
        editText: '',
        replyFormOpen: true,
        createText: '',
      })
    ).toBe(0);
  });
});

describe('buildReplyCommentInput', () => {
  it('marks the reply as a non-root comment with its parent', () => {
    expect(
      buildReplyCommentInput({ text: 'hi', parentCommentId: 'p1', depth: 2 })
    ).toEqual({
      text: 'hi',
      isRootComment: false,
      parentCommentId: 'p1',
      depth: 2,
    });
  });

  it('throws when there is no parent comment id', () => {
    expect(() =>
      buildReplyCommentInput({ text: 'hi', parentCommentId: '', depth: 2 })
    ).toThrow('parentCommentId is required');
  });
});
