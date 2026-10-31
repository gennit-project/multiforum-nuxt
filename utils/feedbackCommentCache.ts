import { isReference } from '@apollo/client/core';
import type { ApolloCache, Reference } from '@apollo/client/core';
import type { AddFeedbackCommentToCommentMutation } from '@/__generated__/operations';

type CreatedFeedback =
  AddFeedbackCommentToCommentMutation['createCommentWithOwnedConnections']['comments'][number];

// Mutation results are normalized by Apollo. Link that reference into existing
// feedback lists, without pretending the sparse mutation selected a query row.
export function appendCreatedFeedback(
  cache: ApolloCache<unknown>,
  targetCommentId: string,
  comment: CreatedFeedback | undefined
) {
  if (!targetCommentId || !comment) return;
  let added = false;
  const id = cache.identify({ __typename: 'Comment', id: targetCommentId });
  cache.modify<{ FeedbackComments: readonly Reference[] }>({
    id,
    fields: {
      FeedbackComments(existing = [], { readField, toReference }) {
        if (!Array.isArray(existing)) return existing;
        const references = existing.filter(isReference);
        if (references.some((item) => readField('id', item) === comment.id))
          return existing;
        const reference = toReference({
          __typename: 'Comment',
          id: comment.id,
        });
        if (!reference) return existing;
        added = true;
        return [...references, reference];
      },
    },
  });
  if (!added) return;
  cache.modify({
    id,
    fields: {
      FeedbackCommentsConnection(existing) {
        if (!existing?.aggregate?.count) return existing;
        return {
          ...existing,
          aggregate: {
            ...existing.aggregate,
            count: {
              ...existing.aggregate.count,
              nodes: (existing.aggregate.count.nodes || 0) + 1,
            },
          },
        };
      },
    },
  });
}
