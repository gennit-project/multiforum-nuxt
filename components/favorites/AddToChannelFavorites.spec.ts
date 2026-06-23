import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import AddToChannelFavorites from '@/components/favorites/AddToChannelFavorites.vue';

const h = vi.hoisted(() => ({
  username: null as unknown,
  favoritesResult: null as unknown,
  refetch: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  addDone: undefined as undefined | (() => void),
  removeDone: undefined as undefined | (() => void),
  showToast: vi.fn(),
  openModal: vi.fn(),
  callIndex: { n: 0 },
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.favoritesResult, refetch: h.refetch }),
  useMutation: () => {
    h.callIndex.n++;
    if (h.callIndex.n === 1)
      return {
        mutate: h.addFavorite,
        onDone: (cb: () => void) => {
          h.addDone = cb;
        },
      };
    return {
      mutate: h.removeFavorite,
      onDone: (cb: () => void) => {
        h.removeDone = cb;
      },
    };
  },
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));
vi.mock('@/stores/toastStore', () => ({
  useToastStore: () => ({ showToast: h.showToast }),
}));
vi.mock('@/stores/addToListModalStore', () => ({
  useAddToListModalStore: () => ({ open: h.openModal }),
}));

const mountFav = (props: Record<string, unknown> = {}) =>
  mount(AddToChannelFavorites, {
    props: { channelUniqueName: 'cats', ...props },
    global: {
      stubs: {
        AddToFavoritesButton: {
          name: 'AddToFavoritesButton',
          props: ['isFavorited', 'isLoading', 'allowAddToList', 'itemId'],
          emits: ['toggle', 'favorite-change'],
          template: '<div />',
        },
      },
    },
  });

const button = (wrapper: ReturnType<typeof mount>) =>
  wrapper.getComponent({ name: 'AddToFavoritesButton' });

beforeEach(() => {
  vi.clearAllMocks();
  h.username = ref('alice');
  h.favoritesResult = ref(null);
  h.addDone = undefined;
  h.removeDone = undefined;
  h.callIndex.n = 0;
  h.addFavorite.mockResolvedValue({});
  h.removeFavorite.mockResolvedValue({});
});

describe('AddToChannelFavorites initial state', () => {
  it('reflects the initialIsFavorited prop', () => {
    const wrapper = mountFav({ initialIsFavorited: true });

    expect(button(wrapper).props('isFavorited')).toBe(true);
  });

  it('derives favorited state from the query when no initial value is given', () => {
    h.favoritesResult = ref({
      users: [{ FavoriteChannels: [{ uniqueName: 'cats' }] }],
    });
    const wrapper = mountFav();

    expect(button(wrapper).props('isFavorited')).toBe(true);
  });
});

describe('AddToChannelFavorites toggle', () => {
  it('adds to favorites when not yet favorited', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).toHaveBeenCalledWith({
      channel: 'cats',
      username: 'alice',
    });
  });

  it('removes from favorites when already favorited', async () => {
    const wrapper = mountFav({ initialIsFavorited: true });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.removeFavorite).toHaveBeenCalledWith({
      channel: 'cats',
      username: 'alice',
    });
  });

  it('does nothing when there is no logged-in user', async () => {
    (h.username as { value: string | null }).value = null;
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).not.toHaveBeenCalled();
  });

  it('reverts the optimistic update when the mutation throws', async () => {
    h.addFavorite.mockRejectedValueOnce(new Error('nope'));
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(button(wrapper).props('isFavorited')).toBe(false);
  });
});

describe('AddToChannelFavorites toasts', () => {
  it('shows a simple toast when add-to-list is not allowed', async () => {
    const wrapper = mountFav({ initialIsFavorited: false, allowAddToList: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.showToast).toHaveBeenCalledWith('Added to Favorites.');
  });

  it('offers an Organize action when add-to-list is allowed', async () => {
    const wrapper = mountFav({ initialIsFavorited: false, allowAddToList: true });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.showToast).toHaveBeenCalledWith(
      'Added to Favorites.',
      'success',
      expect.objectContaining({ label: 'Organize' })
    );
  });

  it('shows a removal toast when un-favoriting', async () => {
    const wrapper = mountFav({ initialIsFavorited: true });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.showToast).toHaveBeenCalledWith('Removed from favorites.');
  });
});

describe('AddToChannelFavorites mutation completion', () => {
  it('clears loading and marks favorited when the add completes', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    h.addDone?.();
    await wrapper.vm.$nextTick();

    expect(button(wrapper).props('isFavorited')).toBe(true);
  });

  it('syncs favorited state from the child favorite-change event', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('favorite-change', true);

    expect(button(wrapper).props('isFavorited')).toBe(true);
  });
});
