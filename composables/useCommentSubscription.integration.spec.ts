import { describe, it, expect, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { ApolloClient, InMemoryCache } from '@apollo/client/core';
import { MockLink } from '@apollo/client/testing/core';
import { provideApolloClient } from '@vue/apollo-composable';
import {
  GetPermalinkedCommentDocument,
  SubscribeToCommentDocument,
  UnsubscribeFromCommentDocument,
  type SubscribeToCommentMutation,
  type UnsubscribeFromCommentMutation,
} from '@/__generated__/operations';
import { makePermalinkedComment } from '@/tests/utils/permalinkFixtures';
import { useCommentSubscription } from './useCommentSubscription';
vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: vi.fn(),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));

function setup(mocks: ConstructorParameters<typeof MockLink>[0]) {
  const cache = new InMemoryCache();
  for (const id of ['c1', 'c2']) {
    const root = { ...makePermalinkedComment({ id }), __typename: 'Comment' };
    cache.writeQuery({
      query: GetPermalinkedCommentDocument,
      variables: { id },
      data: { comments: [root] },
    });
  }
  const client = new ApolloClient({ cache, link: new MockLink(mocks) });
  const scope = effectScope();
  const current = ref({ id: 'c1', SubscribedToNotifications: [] });
  const subscription = scope.run(() =>
    provideApolloClient(client)(() => useCommentSubscription(current))
  )!;
  const users = (id: string) =>
    cache.readQuery({ query: GetPermalinkedCommentDocument, variables: { id } })
      ?.comments[0]?.SubscribedToNotifications;
  return {
    current,
    subscription,
    users,
    cleanup: () => {
      scope.stop();
      client.stop();
    },
  };
}
const subscribed = {
  __typename: 'Comment',
  id: 'c1',
  SubscribedToNotifications: [{ __typename: 'User', username: 'alice' }],
};
const unsubscribed = {
  __typename: 'Comment',
  id: 'c1',
  SubscribedToNotifications: [],
};

describe('subscription normalization with real Apollo', () => {
  it('replaces lists on repeated subscribe/unsubscribe without duplicates', async () => {
    const data: SubscribeToCommentMutation = { subscribeToComment: subscribed };
    const removed: UnsubscribeFromCommentMutation = {
      unsubscribeFromComment: unsubscribed,
    };
    const h = setup([
      {
        request: {
          query: SubscribeToCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data },
        maxUsageCount: 2,
      },
      {
        request: {
          query: UnsubscribeFromCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data: removed },
      },
    ]);
    try {
      await h.subscription.watchReplies();
      const first = h.users('c1');
      await h.subscription.watchReplies();
      const second = h.users('c1');
      await h.subscription.unwatchReplies();
      expect([first, second, h.users('c1')]).toEqual([
        [{ __typename: 'User', username: 'alice' }],
        [{ __typename: 'User', username: 'alice' }],
        [],
      ]);
    } finally {
      h.cleanup();
    }
  });
  it('normalizes a late response to the returned ID after navigation', async () => {
    const h = setup([
      {
        request: {
          query: SubscribeToCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data: { subscribeToComment: subscribed } },
        delay: 10,
      },
    ]);
    try {
      const pending = h.subscription.watchReplies();
      h.current.value = { id: 'c2', SubscribedToNotifications: [] };
      await pending;
      expect({ original: h.users('c1'), current: h.users('c2') }).toEqual({
        original: [{ __typename: 'User', username: 'alice' }],
        current: [],
      });
    } finally {
      h.cleanup();
    }
  });
  it('preserves the subscriber list when unsubscribe returns null', async () => {
    const h = setup([
      {
        request: {
          query: SubscribeToCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data: { subscribeToComment: subscribed } },
      },
      {
        request: {
          query: UnsubscribeFromCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data: { unsubscribeFromComment: null } },
      },
    ]);
    try {
      await h.subscription.watchReplies();
      await h.subscription.unwatchReplies();
      expect(h.users('c1')).toEqual([
        { __typename: 'User', username: 'alice' },
      ]);
    } finally {
      h.cleanup();
    }
  });
  it('preserves membership when unsubscribe fails', async () => {
    const h = setup([
      {
        request: {
          query: SubscribeToCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data: { subscribeToComment: subscribed } },
      },
      {
        request: {
          query: UnsubscribeFromCommentDocument,
          variables: { commentId: 'c1' },
        },
        error: new Error('offline'),
      },
    ]);
    try {
      await h.subscription.watchReplies();
      const result = await h.subscription
        .unwatchReplies()
        .catch((error) => error.message);
      expect({ result, users: h.users('c1') }).toEqual({
        result: 'offline',
        users: [{ __typename: 'User', username: 'alice' }],
      });
    } finally {
      h.cleanup();
    }
  });
  it('leaves cache unchanged on a nullable response', async () => {
    const h = setup([
      {
        request: {
          query: SubscribeToCommentDocument,
          variables: { commentId: 'c1' },
        },
        result: { data: { subscribeToComment: null } },
      },
    ]);
    try {
      await h.subscription.watchReplies();
      expect(h.users('c1')).toEqual([]);
    } finally {
      h.cleanup();
    }
  });
  it('rejects a failed request without modifying the cached list', async () => {
    const h = setup([
      {
        request: {
          query: SubscribeToCommentDocument,
          variables: { commentId: 'c1' },
        },
        error: new Error('offline'),
      },
    ]);
    try {
      const result = await h.subscription
        .watchReplies()
        .catch((error) => error.message);
      expect({ result, users: h.users('c1') }).toEqual({
        result: 'offline',
        users: [],
      });
    } finally {
      h.cleanup();
    }
  });
});
