import { describe, it, expect } from 'vitest';
import { InMemoryCache } from '@apollo/client/core';
import {
  GetCommentSectionDocument,
  CreateCommentDocument,
} from '@/__generated__/operations';
import {
  makeCreatedComment,
  makeRootSection,
} from '@/tests/utils/rootCommentFixtures';
import {
  insertRootComment,
  incrementCreatedCommentCount,
} from './rootCommentCache';
const scope = {
  discussionId: 'd1',
  channelUniqueName: 'cats',
  modName: '',
  sort: 'new',
};
const variables = { ...scope, offset: 0, limit: 20 };
const makeCache = () => {
  const cache = new InMemoryCache();
  cache.writeQuery({
    query: CreateCommentDocument,
    data: {
      createCommentWithOwnedConnections: {
        comments: [{ ...created(), __typename: 'Comment' }],
      },
    },
  });
  return cache;
};
const created = () => ({
  ...makeCreatedComment(),
  DiscussionChannel: {
    id: 'd1-cats',
    discussionId: 'd1',
    channelUniqueName: 'cats',
  },
});
describe('root comment cache isolation', () => {
  it.each([20, 50])(
    'immediately inserts into an existing %i-item first page',
    (limit) => {
      const cache = makeCache();
      const vars = { ...variables, limit };
      cache.writeQuery({
        query: GetCommentSectionDocument,
        variables: vars,
        data: { getCommentSection: makeRootSection() },
      });
      insertRootComment(cache, created(), scope);
      expect(
        cache
          .readQuery({ query: GetCommentSectionDocument, variables: vars })
          ?.getCommentSection?.Comments.map((c) => c.id)
      ).toEqual(['new']);
    }
  );
  it.each([
    { channelUniqueName: 'dogs' },
    { discussionId: 'd2' },
    { sort: 'top' },
    { modName: 'moderator' },
    { offset: 20 },
  ])('preserves unrelated cache variables %j', (override) => {
    const cache = makeCache();
    const vars = { ...variables, ...override };
    cache.writeQuery({
      query: GetCommentSectionDocument,
      variables: vars,
      data: {
        getCommentSection: makeRootSection(
          vars.discussionId,
          vars.channelUniqueName
        ),
      },
    });
    insertRootComment(cache, created(), scope);
    expect(
      cache.readQuery({ query: GetCommentSectionDocument, variables: vars })
        ?.getCommentSection?.Comments
    ).toEqual([]);
  });
  it('does not fabricate a section on a cache miss', () => {
    const cache = makeCache();
    insertRootComment(cache, created(), scope);
    expect(
      cache.readQuery({ query: GetCommentSectionDocument, variables })
    ).toBeNull();
  });
  it('increments normalized root and total counts exactly once for a repeated result', () => {
    const cache = makeCache();
    const section = makeRootSection();
    const data = {
      getCommentSection: {
        ...section,
        DiscussionChannel: {
          ...section.DiscussionChannel!,
          __typename: 'DiscussionChannel',
        },
      },
    };
    cache.writeQuery({ query: GetCommentSectionDocument, variables, data });
    insertRootComment(cache, created(), scope);
    insertRootComment(cache, created(), scope);
    const channel = cache.readQuery({
      query: GetCommentSectionDocument,
      variables,
    })?.getCommentSection?.DiscussionChannel;
    expect({
      total: channel?.CommentsConnection.aggregate.count.nodes,
      roots: channel?.RootCommentsConnection.aggregate.count.nodes,
    }).toEqual({ total: 1, roots: 1 });
  });
  it('increments only the total count for replies and ignores repeated responses', () => {
    const cache = makeCache();
    const section = makeRootSection();
    const data = {
      getCommentSection: {
        ...section,
        DiscussionChannel: {
          ...section.DiscussionChannel!,
          __typename: 'DiscussionChannel',
        },
      },
    };
    cache.writeQuery({ query: GetCommentSectionDocument, variables, data });
    const reply = { ...created(), ParentComment: { id: 'parent' } };
    incrementCreatedCommentCount(cache, reply);
    incrementCreatedCommentCount(cache, reply);
    const channel = cache.readQuery({
      query: GetCommentSectionDocument,
      variables,
    })?.getCommentSection?.DiscussionChannel;
    expect({
      total: channel?.CommentsConnection.aggregate.count.nodes,
      roots: channel?.RootCommentsConnection.aggregate.count.nodes,
    }).toEqual({ total: 1, roots: 0 });
  });
  it('does not append a duplicate response', () => {
    const cache = makeCache();
    cache.writeQuery({
      query: GetCommentSectionDocument,
      variables,
      data: { getCommentSection: makeRootSection() },
    });
    insertRootComment(cache, created(), scope);
    insertRootComment(cache, created(), scope);
    expect(
      cache
        .readQuery({ query: GetCommentSectionDocument, variables })
        ?.getCommentSection?.Comments.map((c) => c.id)
    ).toEqual(['new']);
  });
  it('ignores a response whose actual conversation does not match submission scope', () => {
    const cache = makeCache();
    cache.writeQuery({
      query: GetCommentSectionDocument,
      variables,
      data: { getCommentSection: makeRootSection() },
    });
    insertRootComment(cache, created(), {
      ...scope,
      channelUniqueName: 'dogs',
    });
    expect(
      cache.readQuery({ query: GetCommentSectionDocument, variables })
        ?.getCommentSection?.Comments
    ).toEqual([]);
  });
});
