import { gql, InMemoryCache } from '@apollo/client/core';
const fragment = gql`
  fragment PageFeedbackCacheTest on Comment {
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
export function makeFeedbackPageCache(parentId: string, childId: string) {
  const cache = new InMemoryCache();
  cache.writeFragment({
    id: `Comment:${parentId}`,
    fragment,
    data: {
      __typename: 'Comment',
      id: parentId,
      FeedbackComments: [{ __typename: 'Comment', id: childId }],
      FeedbackCommentsConnection: { aggregate: { count: { nodes: 1 } } },
    },
  });
  cache.writeFragment({
    id: 'Comment:sibling',
    fragment,
    data: {
      __typename: 'Comment',
      id: 'sibling',
      FeedbackComments: [],
      FeedbackCommentsConnection: { aggregate: { count: { nodes: 0 } } },
    },
  });
  cache.writeFragment({
    id: 'Comment:new',
    fragment: gql`
      fragment PageNewFeedbackTest on Comment {
        id
      }
    `,
    data: { __typename: 'Comment', id: 'new' },
  });
  return {
    cache,
    read: (id: string) => cache.readFragment({ id: `Comment:${id}`, fragment }),
  };
}
