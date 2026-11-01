import { describe, it, expect } from 'vitest';
import { gql, InMemoryCache } from '@apollo/client/core';
import { appendCreatedFeedback } from './feedbackCommentCache';
import type { AddFeedbackCommentToCommentMutation } from '@/__generated__/operations';
const fragment = gql`
  fragment FeedbackCacheTest on Comment {
    id
    FeedbackComments {
      id
    }
    FeedbackCommentsConnection {
      aggregate {
        count {
          nodes
        }
      }
    }
  }
`;
const created: AddFeedbackCommentToCommentMutation['createCommentWithOwnedConnections']['comments'][number] =
  {
    id: 'feedback',
    isRootComment: false,
    isFeedbackComment: true,
    createdAt: '2026-01-01',
    text: null,
    CommentAuthor: null,
    FeedbackComments: [],
  };
function cacheWithParents() {
  const cache = new InMemoryCache();
  for (const id of ['original', 'other'])
    cache.writeFragment({
      id: `Comment:${id}`,
      fragment,
      data: {
        __typename: 'Comment',
        id,
        FeedbackComments: [],
        FeedbackCommentsConnection: { aggregate: { count: { nodes: 0 } } },
      },
    });
  cache.writeFragment({
    id: 'Comment:feedback',
    fragment: gql`
      fragment CreatedFeedbackTest on Comment {
        id
      }
    `,
    data: { __typename: 'Comment', id: 'feedback' },
  });
  return cache;
}
describe('normalized feedback insertion', () => {
  it('links the normalized mutation row only to its captured parent', () => {
    const cache = cacheWithParents();
    appendCreatedFeedback(cache, 'original', created);
    expect([
      cache.extract()['Comment:original']?.FeedbackComments,
      cache.extract()['Comment:other']?.FeedbackComments,
    ]).toEqual([[{ __ref: 'Comment:feedback' }], []]);
  });
  it('does not double count duplicate mutation delivery', () => {
    const cache = cacheWithParents();
    appendCreatedFeedback(cache, 'original', created);
    appendCreatedFeedback(cache, 'original', created);
    expect(cache.readFragment({ id: 'Comment:original', fragment })).toEqual({
      __typename: 'Comment',
      id: 'original',
      FeedbackComments: [{ __typename: 'Comment', id: 'feedback' }],
      FeedbackCommentsConnection: { aggregate: { count: { nodes: 1 } } },
    });
  });
  it('does not manufacture an absent parent on a cache miss', () => {
    const cache = cacheWithParents();
    appendCreatedFeedback(cache, 'missing', created);
    expect(cache.extract()['Comment:missing']).toBeUndefined();
  });
  it('ignores an absent mutation result', () => {
    const cache = cacheWithParents();
    appendCreatedFeedback(cache, 'original', undefined);
    expect(cache.extract()['Comment:original']?.FeedbackComments).toEqual([]);
  });
});
