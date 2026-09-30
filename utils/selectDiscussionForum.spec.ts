import { describe, it, expect } from 'vitest';
import { selectDiscussionForum } from './selectDiscussionForum';

const submissions = [
  { channelUniqueName: 'empty', CommentsAggregate: { count: 0 } },
  { channelUniqueName: 'active', CommentsAggregate: { count: 1 } },
  { channelUniqueName: 'busy', CommentsAggregate: { count: 8 } },
];
describe('selectDiscussionForum', () => {
  it.each([undefined, 'deleted', ['active']])(
    'defaults to the first populated forum for %j',
    (requested) => {
      expect(selectDiscussionForum(submissions, requested)).toBe('active');
    }
  );
  it.each(['empty', 'active', 'busy'])(
    'honors explicit selection of %s',
    (requested) => {
      expect(selectDiscussionForum(submissions, requested)).toBe(requested);
    }
  );
  it('uses the first forum when none have comments', () => {
    expect(
      selectDiscussionForum([
        { channelUniqueName: 'first' },
        { channelUniqueName: 'second', CommentsAggregate: { count: 0 } },
      ])
    ).toBe('first');
  });
  it('handles discussions without submissions', () => {
    expect(selectDiscussionForum([])).toBe('');
  });
});
