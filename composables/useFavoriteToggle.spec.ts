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
      mutationItemKey: 'discussionId',
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
      mutationItemKey: 'discussionId',
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
    const { useAddToListModalStore } = await import('@/stores/addToListModalStore');
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
      mutationItemKey: 'discussionId',
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
      mutationItemKey: 'discussionId',
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
