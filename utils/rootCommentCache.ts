import { storeKeyNameFromField } from '@apollo/client/utilities';
import { visit } from 'graphql';
import type {
  ApolloCache,
  NormalizedCacheObject,
  Reference,
} from '@apollo/client/core';
import {
  GetCommentSectionDocument,
  type CreateCommentMutation,
  type GetCommentSectionQueryVariables,
} from '@/__generated__/operations';
import type { RootCommentSection } from '@/types/DiscussionPresentation';

type CreatedComment = NonNullable<
  CreateCommentMutation['createCommentWithOwnedConnections']
>['comments'][number];
export type RootCommentScope = Pick<
  GetCommentSectionQueryVariables,
  'discussionId' | 'channelUniqueName' | 'sort' | 'modName'
>;
const counted = new WeakMap<ApolloCache<NormalizedCacheObject>, Set<string>>();

// Count aliases share the underlying field name in Apollo. Only the two
// predicates actually selected by this operation may be incremented.
const countFields = new Set<string>();
const rootCountFields = new Set<string>();
visit(GetCommentSectionDocument, {
  Field(node) {
    if (node.name.value === 'CommentsConnection') {
      countFields.add(storeKeyNameFromField(node));
      if (node.alias?.value === 'RootCommentsConnection')
        rootCountFields.add(storeKeyNameFromField(node));
    }
  },
});

// Update existing first-page entries regardless of their page size (detail uses
// 20, inline/download use 50). Never fabricate a section on a cache miss or
// insert a root into another forum, moderator view, sort, or continuation page.
export function insertRootComment(
  cache: ApolloCache<NormalizedCacheObject>,
  comment: CreatedComment,
  scope: RootCommentScope
) {
  const channel = comment.DiscussionChannel;
  if (
    comment.ParentComment ||
    !channel ||
    channel.discussionId !== scope.discussionId ||
    channel.channelUniqueName !== scope.channelUniqueName
  )
    return;
  let alreadyPresent = false;
  const root = cache.extract().ROOT_QUERY;
  for (const key of Object.keys(root || {})) {
    if (!key.startsWith('getCommentSection(') || !key.endsWith(')')) continue;
    let args: unknown;
    try {
      args = JSON.parse(key.slice('getCommentSection('.length, -1));
    } catch {
      continue;
    }
    if (
      !args ||
      typeof args !== 'object' ||
      !('discussionId' in args) ||
      !('channelUniqueName' in args) ||
      !('sort' in args) ||
      !('modName' in args) ||
      !('offset' in args) ||
      !('limit' in args)
    )
      continue;
    if (
      args.discussionId !== scope.discussionId ||
      args.channelUniqueName !== scope.channelUniqueName ||
      (args.sort ?? null) !== (scope.sort ?? null) ||
      (args.modName ?? null) !== (scope.modName ?? null) ||
      args.offset !== 0 ||
      typeof args.limit !== 'number'
    )
      continue;
    const variables = { ...scope, offset: 0, limit: args.limit };
    const previous = cache.readQuery({
      query: GetCommentSectionDocument,
      variables,
    });
    const section = previous?.getCommentSection;
    if (!section || section.DiscussionChannel?.id !== channel.id) continue;
    if (section.Comments.some((item) => item.id === comment.id)) {
      alreadyPresent = true;
      continue;
    }
    cache.modify<{
      getCommentSection: {
        Comments: Reference[];
        DiscussionChannel: Reference | null;
      } | null;
    }>({
      fields: {
        getCommentSection(existing, { storeFieldName, toReference }) {
          if (!existing || '__ref' in existing || storeFieldName !== key)
            return existing;
          const reference = toReference({
            __typename: 'Comment',
            id: comment.id,
          });
          return reference
            ? { ...existing, Comments: [reference, ...existing.Comments] }
            : existing;
        },
      },
    });
  }
  incrementCreatedCommentCount(cache, comment, alreadyPresent);
}

export function incrementCreatedCommentCount(
  cache: ApolloCache<NormalizedCacheObject>,
  comment: CreatedComment,
  alreadyPresent = false
) {
  const channel = comment.DiscussionChannel;
  if (!channel) return;
  let ids = counted.get(cache);
  if (!ids) {
    ids = new Set();
    counted.set(cache, ids);
  }
  if (ids.has(comment.id)) return;
  ids.add(comment.id);
  if (alreadyPresent) return;
  type Connection = NonNullable<
    RootCommentSection['DiscussionChannel']
  >['CommentsConnection'];
  const increment = (existing: Connection | Reference | undefined) =>
    existing && !('__ref' in existing) && existing.aggregate?.count
      ? {
          ...existing,
          aggregate: {
            ...existing.aggregate,
            count: {
              ...existing.aggregate.count,
              nodes: existing.aggregate.count.nodes + 1,
            },
          },
        }
      : existing;
  cache.modify({
    id: cache.identify({ __typename: 'DiscussionChannel', id: channel.id }),
    fields: {
      CommentsConnection(existing, { storeFieldName }) {
        return countFields.has(storeFieldName) &&
          (!comment.ParentComment || !rootCountFields.has(storeFieldName))
          ? increment(existing)
          : existing;
      },
    },
  });
}
