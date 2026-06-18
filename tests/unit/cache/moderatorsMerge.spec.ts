import { describe, it, expect } from 'vitest';
import { InMemoryCache, gql } from '@apollo/client/core';
import { inMemoryCacheOptions } from '@/cache';

// Two queries that both write the unfiltered Channel.Moderators field but with
// DIFFERENT sub-selections. This mirrors the real app, where GET_MODS_BY_CHANNEL
// fetches `Moderators { displayName User { username } }` while other queries
// (e.g. the channel sidebar) fetch only `Moderators { displayName }`. Before the
// Channel.Moderators merge function, the last write replaced the array, so the
// resolved moderator list (and the "Forum Mod" badge derived from it) depended on
// write order — which differs between SSR and client hydration, causing a
// hydration mismatch.

const MODS_WITH_USER = gql`
  query getModsByChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Moderators {
        displayName
        User {
          username
        }
      }
    }
  }
`;

const MODS_DISPLAY_NAME_ONLY = gql`
  query getChannel($channelUniqueName: String!) {
    channels(where: { uniqueName: $channelUniqueName }) {
      uniqueName
      Moderators {
        displayName
      }
    }
  }
`;

const variables = { channelUniqueName: 'cats' };

const withUserData = {
  channels: [
    {
      __typename: 'Channel',
      uniqueName: 'cats',
      Moderators: [
        {
          __typename: 'ModerationProfile',
          displayName: 'mod_alice',
          User: { __typename: 'User', username: 'alice' },
        },
      ],
    },
  ],
};

const displayNameOnlyData = {
  channels: [
    {
      __typename: 'Channel',
      uniqueName: 'cats',
      Moderators: [
        { __typename: 'ModerationProfile', displayName: 'mod_alice' },
      ],
    },
  ],
};

const readModerators = (cache: InMemoryCache) =>
  cache.readQuery<{
    channels: Array<{
      Moderators: Array<{ displayName: string; User?: { username: string } }>;
    }>;
  }>({ query: MODS_WITH_USER, variables })?.channels?.[0]?.Moderators ?? [];

describe('Channel.Moderators cache merge', () => {
  it('preserves User.username when a displayName-only write follows the full write', () => {
    const cache = new InMemoryCache(inMemoryCacheOptions);
    cache.writeQuery({ query: MODS_WITH_USER, variables, data: withUserData });
    cache.writeQuery({
      query: MODS_DISPLAY_NAME_ONLY,
      variables,
      data: displayNameOnlyData,
    });
    expect(readModerators(cache)[0]?.User?.username).toBe('alice');
  });

  it('preserves User.username regardless of write order (displayName-only first)', () => {
    const cache = new InMemoryCache(inMemoryCacheOptions);
    cache.writeQuery({
      query: MODS_DISPLAY_NAME_ONLY,
      variables,
      data: displayNameOnlyData,
    });
    cache.writeQuery({ query: MODS_WITH_USER, variables, data: withUserData });
    expect(readModerators(cache)[0]?.User?.username).toBe('alice');
  });

  it('does not drop a moderator that a later partial write omits', () => {
    const cache = new InMemoryCache(inMemoryCacheOptions);
    cache.writeQuery({
      query: MODS_WITH_USER,
      variables,
      data: {
        channels: [
          {
            __typename: 'Channel',
            uniqueName: 'cats',
            Moderators: [
              {
                __typename: 'ModerationProfile',
                displayName: 'mod_alice',
                User: { __typename: 'User', username: 'alice' },
              },
              {
                __typename: 'ModerationProfile',
                displayName: 'mod_bob',
                User: { __typename: 'User', username: 'bob' },
              },
            ],
          },
        ],
      },
    });
    cache.writeQuery({
      query: MODS_DISPLAY_NAME_ONLY,
      variables,
      data: displayNameOnlyData,
    });
    expect(readModerators(cache).map((mod) => mod.displayName)).toEqual([
      'mod_alice',
      'mod_bob',
    ]);
  });
});
