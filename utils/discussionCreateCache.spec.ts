import { describe, it, expect } from 'vitest';
import { gql, InMemoryCache } from '@apollo/client/core';
import type { CreateDiscussionMutation } from '@/__generated__/operations';
import { appendCreatedDiscussion } from './discussionCreateCache';
const query = gql`
  query DiscussionCacheTest(
    $channelUniqueName: String!
    $searchInput: String!
  ) {
    getDiscussionsInChannel(
      channelUniqueName: $channelUniqueName
      searchInput: $searchInput
    ) {
      discussionChannels {
        id
      }
      aggregateDiscussionChannelsCount
    }
  }
`;
const created: CreateDiscussionMutation = {
  createDiscussionWithChannelConnections: [
    {
      id: 'd',
      title: 'new',
      body: null,
      createdAt: 'now',
      updatedAt: null,
      Author: null,
      Tags: [],
      DiscussionChannels: [
        {
          id: 'dc',
          discussionId: 'd',
          channelUniqueName: 'cats',
          createdAt: 'now',
          archived: false,
          answered: false,
          locked: false,
          weightedVotesCount: 0,
          Channel: { uniqueName: 'cats' },
          Discussion: { id: 'd' },
          UpvotedByUsers: [],
          UpvotedByUsersConnection: { aggregate: { count: { nodes: 0 } } },
          CommentsConnection: { aggregate: { count: { nodes: 0 } } },
        },
      ],
    },
  ],
};
function prepare() {
  const cache = new InMemoryCache();
  for (const [channelUniqueName, searchInput] of [
    ['cats', ''],
    ['dogs', ''],
    ['cats', 'needle'],
  ])
    cache.writeQuery({
      query,
      variables: { channelUniqueName, searchInput },
      data: {
        getDiscussionsInChannel: {
          discussionChannels: [],
          aggregateDiscussionChannelsCount: 0,
        },
      },
    });
  cache.writeFragment({
    id: 'DiscussionChannel:dc',
    fragment: gql`
      fragment CreatedChannelTest on DiscussionChannel {
        id
      }
    `,
    data: { __typename: 'DiscussionChannel', id: 'dc' },
  });
  return cache;
}
describe('created discussion scoped cache links', () => {
  it('updates only the matching unfiltered forum and counts once across repeats', () => {
    const cache = prepare();
    appendCreatedDiscussion(cache, created);
    appendCreatedDiscussion(cache, created);
    expect(
      [
        ['cats', ''],
        ['dogs', ''],
        ['cats', 'needle'],
      ].map(([channelUniqueName, searchInput]) =>
        cache.readQuery({
          query,
          variables: { channelUniqueName, searchInput },
        })
      )
    ).toEqual([
      {
        getDiscussionsInChannel: {
          discussionChannels: [{ __typename: 'DiscussionChannel', id: 'dc' }],
          aggregateDiscussionChannelsCount: 1,
        },
      },
      {
        getDiscussionsInChannel: {
          discussionChannels: [],
          aggregateDiscussionChannelsCount: 0,
        },
      },
      {
        getDiscussionsInChannel: {
          discussionChannels: [],
          aggregateDiscussionChannelsCount: 0,
        },
      },
    ]);
  });
  it('does not manufacture a query on cache miss', () => {
    const cache = new InMemoryCache();
    appendCreatedDiscussion(cache, created);
    expect(cache.extract()).toEqual({});
  });
});
