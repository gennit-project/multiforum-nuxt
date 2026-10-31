import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';

const h = vi.hoisted(() => ({
  username: null as unknown as { value: string },
}));

h.username = ref('alice');

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => h.username,
}));

describe('useFavoriteToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    h.username.value = 'alice';
  });

  it('adds a favorite, shows the success toast, and runs the after-toggle hook', async () => {
    const { useFavoriteToggle } = await import('./useFavoriteToggle');
    const { useToastStore } = await import('@/stores/toastStore');
    const isFavorited = ref(false);
    const addFavorite = vi.fn().mockResolvedValue({});
    const onAfterToggle = vi.fn();

    const { handleToggleFavorite } = useFavoriteToggle({
      isFavorited,
      itemId: () => 'd1',
      entityType: () => 'discussion',
      allowAddToList: () => false,
      addedMessage: () => 'Added',
      removedMessage: () => 'Removed',
      addFavorite,
      removeFavorite: vi.fn(),
      variables: (itemId, username) => ({ discussionId: itemId, username }),
      onAfterToggle,
    });

    await handleToggleFavorite();

    const toastStore = useToastStore();
    expect({
      favorited: isFavorited.value,
      variables: addFavorite.mock.calls[0]?.[0],
      toast: toastStore.toasts[0]?.message,
      after: onAfterToggle.mock.calls.length,
    }).toEqual({
      favorited: true,
      variables: { discussionId: 'd1', username: 'alice' },
      toast: 'Added',
      after: 1,
    });
  });

  it('removes a favorite and shows the removed toast', async () => {
    const { useFavoriteToggle } = await import('./useFavoriteToggle');
    const { useToastStore } = await import('@/stores/toastStore');
    const isFavorited = ref(true);
    const removeFavorite = vi.fn().mockResolvedValue({});

    const { handleToggleFavorite } = useFavoriteToggle({
      isFavorited,
      itemId: () => 'd1',
      entityType: () => 'discussion',
      allowAddToList: () => false,
      addedMessage: () => 'Added',
      removedMessage: () => 'Removed',
      addFavorite: vi.fn(),
      removeFavorite,
      variables: (itemId, username) => ({ discussionId: itemId, username }),
    });

    await handleToggleFavorite();

    const toastStore = useToastStore();
    expect({
      favorited: isFavorited.value,
      variables: removeFavorite.mock.calls[0]?.[0],
      toast: toastStore.toasts[0]?.message,
    }).toEqual({
      favorited: false,
      variables: { discussionId: 'd1', username: 'alice' },
      toast: 'Removed',
    });
  });

  it('adds an Organize action when add-to-list is allowed', async () => {
    const { useFavoriteToggle } = await import('./useFavoriteToggle');
    const { useToastStore } = await import('@/stores/toastStore');
    const { useAddToListModalStore } =
      await import('@/stores/addToListModalStore');
    const isFavorited = ref(false);

    const { handleToggleFavorite } = useFavoriteToggle({
      isFavorited,
      itemId: () => 'd1',
      entityType: () => 'discussion',
      allowAddToList: () => true,
      addedMessage: () => 'Added',
      removedMessage: () => 'Removed',
      addFavorite: vi.fn().mockResolvedValue({}),
      removeFavorite: vi.fn(),
      variables: (itemId, username) => ({ discussionId: itemId, username }),
    });

    await handleToggleFavorite();

    const toastStore = useToastStore();
    const modalStore = useAddToListModalStore();
    toastStore.toasts[0]?.action?.onClick();

    expect({
      label: toastStore.toasts[0]?.action?.label,
      modalOpen: modalStore.isOpen,
      itemId: modalStore.itemId,
      itemType: modalStore.itemType,
    }).toEqual({
      label: 'Organize',
      modalOpen: true,
      itemId: 'd1',
      itemType: 'discussion',
    });
  });

  it('reverts the optimistic toggle and shows an error toast when the mutation fails', async () => {
    const { useFavoriteToggle } = await import('./useFavoriteToggle');
    const { useToastStore } = await import('@/stores/toastStore');
    const isFavorited = ref(false);

    const { handleToggleFavorite } = useFavoriteToggle({
      isFavorited,
      itemId: () => 'd1',
      entityType: () => 'discussion',
      allowAddToList: () => false,
      addedMessage: () => 'Added',
      removedMessage: () => 'Removed',
      addFavorite: vi.fn().mockRejectedValue(new Error('boom')),
      removeFavorite: vi.fn(),
      variables: (itemId, username) => ({ discussionId: itemId, username }),
    });

    await handleToggleFavorite();

    const toastStore = useToastStore();
    expect({
      favorited: isFavorited.value,
      toast: toastStore.toasts[0]?.message,
      type: toastStore.toasts[0]?.type,
    }).toEqual({
      favorited: false,
      toast: 'Error updating favorites. Please try again.',
      type: 'error',
    });
  });
});

describe('favorite mutation request scope', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    h.username.value = 'alice';
  });

  it('ignores a repeated click while the first request is pending', async () => {
    const { useFavoriteToggle } = await import('./useFavoriteToggle');
    let finish = () => {};
    const addFavorite = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { handleToggleFavorite } = useFavoriteToggle({
      isFavorited: ref(false),
      itemId: () => 'd1',
      entityType: () => 'discussion',
      allowAddToList: () => false,
      addedMessage: () => 'Added',
      removedMessage: () => 'Removed',
      addFavorite,
      removeFavorite: vi.fn(),
      variables: (discussionId, username) => ({ discussionId, username }),
    });
    const pending = handleToggleFavorite();
    await handleToggleFavorite();
    finish();
    await pending;
    expect(addFavorite).toHaveBeenCalledTimes(1);
  });

  it('does not refetch or toast for a different item after navigation', async () => {
    const { useFavoriteToggle } = await import('./useFavoriteToggle');
    const { useToastStore } = await import('@/stores/toastStore');
    let finish = () => {};
    const itemId = ref('d1');
    const onAfterToggle = vi.fn();
    const { handleToggleFavorite } = useFavoriteToggle({
      isFavorited: ref(false),
      itemId: () => itemId.value,
      entityType: () => 'discussion',
      allowAddToList: () => false,
      addedMessage: () => 'Added',
      removedMessage: () => 'Removed',
      addFavorite: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      removeFavorite: vi.fn(),
      variables: (discussionId, username) => ({ discussionId, username }),
      onAfterToggle,
    });
    const pending = handleToggleFavorite();
    itemId.value = 'd2';
    finish();
    await pending;
    expect({
      toasts: useToastStore().toasts.length,
      refetches: onAfterToggle.mock.calls.length,
    }).toEqual({ toasts: 0, refetches: 0 });
  });
});
