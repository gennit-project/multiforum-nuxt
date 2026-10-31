import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import { useAutoUnsubscribe } from '@/composables/useAutoUnsubscribe';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import {
  SubscribeToCommentDocument,
  UnsubscribeFromCommentDocument,
  type CommentFieldsFragment,
} from '@/__generated__/operations';
import { useCommentSubscription } from './useCommentSubscription';
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
const comment = (
  overrides: Partial<
    Pick<CommentFieldsFragment, 'id' | 'SubscribedToNotifications'>
  > = {}
) => ({ id: 'c1', SubscribedToNotifications: [], ...overrides });
beforeEach(() => {
  router.reset();
  asMock(useMutation).mockImplementation(router.useMutation);
  asMock(useAutoUnsubscribe).mockReset();
});
describe('comment notification subscriptions', () => {
  it('uses exactly the two generated mutation documents', () => {
    useCommentSubscription(ref(comment()));
    expect(
      asMock(useMutation).mock.calls.map(([document]) => document)
    ).toEqual([SubscribeToCommentDocument, UnsubscribeFromCommentDocument]);
  });
  it.each(['watchReplies', 'unwatchReplies'] as const)(
    'uses the current comment for %s after navigation',
    async (action) => {
      const current = ref(comment());
      const subscription = useCommentSubscription(current);
      current.value = comment({ id: 'c2' });
      await subscription[action]();
      expect(
        router.get(
          action === 'watchReplies'
            ? 'subscribeToComment'
            : 'unsubscribeFromComment'
        ).mutate
      ).toHaveBeenCalledWith({ commentId: 'c2' });
    }
  );
  it.each([
    { users: [] },
    { users: [{ username: 'bob' }] },
    { users: [{ username: 'alice' }] },
  ])('derives membership from selected users %j', ({ users }) => {
    const { isSubscribed } = useCommentSubscription(
      ref(comment({ SubscribedToNotifications: users }))
    );
    expect(isSubscribed.value).toBe(
      users.some((user) => user.username === 'alice')
    );
  });
  it('wires auto-unsubscribe to its supplied ID', async () => {
    useCommentSubscription(ref(comment()));
    const params = asMock(useAutoUnsubscribe).mock.calls[0]![0];
    await params.unsubscribeFn('c9');
    expect(router.get('unsubscribeFromComment').mutate).toHaveBeenCalledWith({
      commentId: 'c9',
    });
  });
});
