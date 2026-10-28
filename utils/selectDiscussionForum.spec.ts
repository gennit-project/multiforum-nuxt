import { describe, it, expect } from 'vitest';
import { selectDiscussionForum } from './selectDiscussionForum';

const submissions = [
  {
    channelUniqueName: 'empty',
    CommentsConnection: { aggregate: { count: { nodes: 0 } } },
  },
  {
    channelUniqueName: 'active',
    CommentsConnection: { aggregate: { count: { nodes: 1 } } },
  },
  {
    channelUniqueName: 'busy',
    CommentsConnection: { aggregate: { count: { nodes: 8 } } },
  },
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
        {
          channelUniqueName: 'second',
          CommentsConnection: { aggregate: { count: { nodes: 0 } } },
        },
      ])
    ).toBe('first');
  });
  it('handles discussions without submissions', () => {
    expect(selectDiscussionForum([])).toBe('');
  });
});
