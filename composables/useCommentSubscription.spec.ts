import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useAutoUnsubscribe } from '@/composables/useAutoUnsubscribe';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import { useCommentSubscription } from './useCommentSubscription';
import type { Comment } from '@/__generated__/graphql';

vi.mock('@vue/apollo-composable', () => ({ useMutation: vi.fn() }));
vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: vi.fn(),
}));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));

const router = createMutationRouter([
  'subscribeToComment',
  'unsubscribeFromComment',
]);

const comment = (overrides: Record<string, unknown> = {}): Comment =>
  ({
    id: 'c1',
    __typename: 'Comment',
    SubscribedToNotifications: [],
    ...overrides,
  }) as unknown as Comment;

const fakeCache = () => ({
  identify: vi.fn(() => 'Comment:c1'),
  modify: vi.fn(),
});

beforeEach(() => {
  router.reset();
  asMock(useMutation).mockImplementation(router.useMutation);
  asMock(useAutoUnsubscribe).mockReset();
});

describe('useCommentSubscription', () => {
  it('subscribes to the comment when watchReplies is called', () => {
    const { watchReplies } = useCommentSubscription(ref(comment()));
    watchReplies();
    expect(router.get('subscribeToComment').mutate).toHaveBeenCalledWith({
      commentId: 'c1',
    });
  });

  it('unsubscribes from the comment when unwatchReplies is called', () => {
    const { unwatchReplies } = useCommentSubscription(ref(comment()));
    unwatchReplies();
    expect(router.get('unsubscribeFromComment').mutate).toHaveBeenCalledWith({
      commentId: 'c1',
    });
  });

  it('writes the new subscriber list on a successful subscribe', () => {
    useCommentSubscription(ref(comment()));
    let fieldFn: (existing?: unknown) => unknown = () => undefined;
    const cache = {
      identify: vi.fn(() => 'Comment:c1'),
      modify: vi.fn((opts: any) => {
        fieldFn = opts.fields.SubscribedToNotifications;
      }),
    };
    router.get('subscribeToComment').update!(cache, {
      data: { subscribeToComment: { SubscribedToNotifications: [{ username: 'alice' }] } },
    });
    expect(fieldFn()).toEqual([{ username: 'alice' }]);
  });

  it('writes the new subscriber list on a successful unsubscribe', () => {
    useCommentSubscription(ref(comment()));
    const cache = fakeCache();
    router.get('unsubscribeFromComment').update!(cache, {
      data: { unsubscribeFromComment: { SubscribedToNotifications: [] } },
    });
    expect(cache.modify).toHaveBeenCalledTimes(1);
  });

  it('does nothing on subscribe when the mutation returned no data', () => {
    useCommentSubscription(ref(comment()));
    const cache = fakeCache();
    router.get('subscribeToComment').update!(cache, { data: {} });
    expect(cache.modify).not.toHaveBeenCalled();
  });

  it('reports isSubscribed true when the current user is in the list', () => {
    const { isSubscribed } = useCommentSubscription(
      ref(comment({ SubscribedToNotifications: [{ username: 'alice' }] }))
    );
    expect(isSubscribed.value).toBe(true);
  });

  it('reports isSubscribed false when the current user is not in the list', () => {
    const { isSubscribed } = useCommentSubscription(
      ref(comment({ SubscribedToNotifications: [{ username: 'bob' }] }))
    );
    expect(isSubscribed.value).toBe(false);
  });

  it('wires an auto-unsubscribe handler that calls the unsubscribe mutation', async () => {
    useCommentSubscription(ref(comment()));
    const params = asMock(useAutoUnsubscribe).mock.calls[0]![0] as {
      unsubscribeFn: (id: string) => Promise<void>;
    };
    await params.unsubscribeFn('c9');
    expect(router.get('unsubscribeFromComment').mutate).toHaveBeenCalledWith({
      commentId: 'c9',
    });
  });
});
