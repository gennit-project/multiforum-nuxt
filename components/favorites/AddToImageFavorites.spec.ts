import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import AddToImageFavorites from '@/components/favorites/AddToImageFavorites.vue';

const h = vi.hoisted(() => ({
  username: null as unknown,
  favoritesResult: null as unknown,
  refetch: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  addDone: undefined as undefined | (() => void),
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
    return { mutate: h.removeFavorite, onDone: () => {} };
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
  mount(AddToImageFavorites, {
    props: { imageId: 'i1', ...props },
    global: {
      stubs: {
        AddToFavoritesButton: {
          name: 'AddToFavoritesButton',
          props: ['isFavorited', 'isLoading', 'allowAddToList'],
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
  h.callIndex.n = 0;
  h.addFavorite.mockResolvedValue({});
  h.removeFavorite.mockResolvedValue({});
});

describe('AddToImageFavorites', () => {
  it('reflects the initialIsFavorited prop', () => {
    expect(button(mountFav({ initialIsFavorited: true })).props('isFavorited')).toBe(
      true
    );
  });

  it('derives favorited state from the query', () => {
    h.favoritesResult = ref({ users: [{ FavoriteImages: [{ id: 'i1' }] }] });

    expect(button(mountFav()).props('isFavorited')).toBe(true);
  });

  it('adds with the image id', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).toHaveBeenCalledWith({
      imageId: 'i1',
      username: 'alice',
    });
  });

  it('removes with the image id', async () => {
    const wrapper = mountFav({ initialIsFavorited: true });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.removeFavorite).toHaveBeenCalledWith({
      imageId: 'i1',
      username: 'alice',
    });
  });

  it('does nothing without a user', async () => {
    (h.username as { value: string | null }).value = null;
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).not.toHaveBeenCalled();
  });

  it('reverts the optimistic update on error', async () => {
    h.addFavorite.mockRejectedValueOnce(new Error('nope'));
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(button(wrapper).props('isFavorited')).toBe(false);
  });

  it('optimistically marks favorited on add', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(button(wrapper).props('isFavorited')).toBe(true);
  });
});
