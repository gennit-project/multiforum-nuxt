import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';

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
  mount(AddToDiscussionFavorites, {
    props: { discussionId: 'd1', ...props },
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

describe('AddToDiscussionFavorites', () => {
  it('reflects the initialIsFavorited prop', () => {
    expect(button(mountFav({ initialIsFavorited: true })).props('isFavorited')).toBe(
      true
    );
  });

  it('derives favorited state from the query', () => {
    h.favoritesResult = ref({ users: [{ FavoriteDiscussions: [{ id: 'd1' }] }] });

    expect(button(mountFav()).props('isFavorited')).toBe(true);
  });

  it('adds with the discussion id', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).toHaveBeenCalledWith({
      discussionId: 'd1',
      username: 'alice',
    });
  });

  it('removes with the discussion id', async () => {
    const wrapper = mountFav({ initialIsFavorited: true });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.removeFavorite).toHaveBeenCalledWith({
      discussionId: 'd1',
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

  it('offers the Organize action when add-to-list is allowed', async () => {
    const wrapper = mountFav({ initialIsFavorited: false, allowAddToList: true });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.showToast).toHaveBeenCalledWith(
      expect.any(String),
      'success',
      expect.objectContaining({ label: 'Organize' })
    );
  });

  it('optimistically marks favorited on add', async () => {
    const wrapper = mountFav({ initialIsFavorited: false });

    await button(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(button(wrapper).props('isFavorited')).toBe(true);
  });
});
