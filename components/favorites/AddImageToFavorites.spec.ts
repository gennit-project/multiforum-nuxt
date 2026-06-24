import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';

import AddImageToFavorites from '@/components/favorites/AddImageToFavorites.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  refetch: vi.fn(),
  addFavorite: vi.fn(() => Promise.resolve()),
  removeFavorite: vi.fn(() => Promise.resolve()),
  index: { n: 0 },
  username: null as unknown,
  showToast: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: h.result, refetch: h.refetch }),
  // [0] addFavorite, [1] removeFavorite
  useMutation: () => ({ mutate: h.index.n++ === 0 ? h.addFavorite : h.removeFavorite }),
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));
vi.mock('@/stores/toastStore', () => ({ useToastStore: () => ({ showToast: h.showToast }) }));

const favoritedResult = (favorited: boolean) => ({
  users: [{ FavoriteImages: favorited ? [{ id: 'img-1' }] : [] }],
});

const mountFav = (props: Record<string, unknown> = {}) =>
  mount(AddImageToFavorites, {
    props: { imageId: 'img-1', ...props },
    global: {
      stubs: {
        AddToFavoritesButton: {
          name: 'AddToFavoritesButton',
          props: ['isFavorited', 'isLoading', 'displayName', 'entityType', 'size', 'itemId'],
          emits: ['toggle'],
          template: '<button @click="$emit(\'toggle\')" />',
        },
      },
    },
  });

const fav = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'AddToFavoritesButton' });

beforeEach(() => {
  vi.clearAllMocks();
  h.index.n = 0;
  h.result = ref(favoritedResult(false));
  h.addFavorite = vi.fn(() => Promise.resolve());
  h.removeFavorite = vi.fn(() => Promise.resolve());
  h.username = ref('alice');
});

describe('AddImageToFavorites state', () => {
  it('reflects the favorited state from the query', () => {
    h.result = ref(favoritedResult(true));
    const wrapper = mountFav();

    expect(fav(wrapper).props('isFavorited')).toBe(true);
  });

  it('reflects the not-favorited state', () => {
    const wrapper = mountFav();

    expect(fav(wrapper).props('isFavorited')).toBe(false);
  });

  it('uses the image title as the display name', () => {
    const wrapper = mountFav({ imageTitle: 'Sunset' });

    expect(fav(wrapper).props('displayName')).toBe('Sunset');
  });

  it('falls back to "image" as the display name', () => {
    const wrapper = mountFav();

    expect(fav(wrapper).props('displayName')).toBe('image');
  });
});

describe('AddImageToFavorites toggle', () => {
  it('adds to favorites when not yet favorited', async () => {
    const wrapper = mountFav();

    await fav(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).toHaveBeenCalledWith({
      imageId: 'img-1',
      username: 'alice',
    });
  });

  it('shows a toast after adding', async () => {
    const wrapper = mountFav();

    await fav(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.showToast).toHaveBeenCalledWith('Image added to favorites.');
  });

  it('removes from favorites when already favorited', async () => {
    h.result = ref(favoritedResult(true));
    const wrapper = mountFav();

    await fav(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.removeFavorite).toHaveBeenCalledWith({
      imageId: 'img-1',
      username: 'alice',
    });
  });

  it('refetches after a successful toggle', async () => {
    const wrapper = mountFav();

    await fav(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.refetch).toHaveBeenCalled();
  });

  it('does nothing when there is no username', async () => {
    h.username = ref('');
    const wrapper = mountFav();

    await fav(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.addFavorite).not.toHaveBeenCalled();
  });

  it('reverts and shows an error toast on failure', async () => {
    h.addFavorite = vi.fn(() => Promise.reject(new Error('nope')));
    const wrapper = mountFav();

    await fav(wrapper).vm.$emit('toggle');
    await flushPromises();

    expect(h.showToast).toHaveBeenCalledWith(
      'Error updating favorites. Please try again.',
      'error'
    );
  });
});
