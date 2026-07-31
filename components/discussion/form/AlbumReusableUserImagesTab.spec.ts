import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumReusableUserImagesTab from '@/components/discussion/form/AlbumReusableUserImagesTab.vue';

const { usernameRef, queryResult, queryLoading, queryError, fetchMore } =
  vi.hoisted(() => ({
    usernameRef: { value: 'alice' as string },
    queryResult: {
      value: {
        users: [
          {
            Images: [{ id: 'upload-1', url: 'https://img.test/u1.jpg' }],
            ImagesAggregate: { count: 30 },
            FavoriteImages: [
              { id: 'fav-1', url: 'https://img.test/f1.jpg' },
              { id: 'fav-2', url: 'https://img.test/f2.jpg' },
            ],
            FavoriteImagesAggregate: { count: 2 },
          },
        ],
      } as Record<string, unknown>,
    },
    queryLoading: { value: false },
    queryError: { value: null as Error | null },
    fetchMore: vi.fn(() => Promise.resolve()),
  }));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(() => ({
    result: queryResult,
    loading: queryLoading,
    error: queryError,
    fetchMore,
  })),
}));

const GridStub = {
  name: 'AlbumReusableImageGrid',
  props: ['images', 'selectedImageIds', 'isLimitReached', 'loading', 'error', 'emptyMessage'],
  emits: ['add-image'],
  template: '<div class="grid-stub" />',
};

const mountTab = (source: 'uploads' | 'favorites') =>
  mountWithDefaults(AlbumReusableUserImagesTab, {
    props: {
      source,
      searchTerm: '',
      selectedImageIds: [],
      isLimitReached: false,
    },
    global: { stubs: { AlbumReusableImageGrid: GridStub } },
  });

const grid = (wrapper: ReturnType<typeof mountTab>) =>
  wrapper.findComponent(GridStub);

const loadMoreButton = (wrapper: ReturnType<typeof mountTab>) =>
  wrapper.findAll('button').find((b) => b.text() === 'Load more');

beforeEach(() => {
  usernameRef.value = 'alice';
  queryLoading.value = false;
  queryError.value = null;
  fetchMore.mockClear();
});

describe('AlbumReusableUserImagesTab', () => {
  it('passes the user uploads to the grid for the uploads source', () => {
    const wrapper = mountTab('uploads');
    expect(grid(wrapper).props('images').map((i: { id: string }) => i.id)).toEqual([
      'upload-1',
    ]);
  });

  it('passes the favorited images to the grid for the favorites source', () => {
    const wrapper = mountTab('favorites');
    expect(grid(wrapper).props('images').map((i: { id: string }) => i.id)).toEqual([
      'fav-1',
      'fav-2',
    ]);
  });

  it('uses an uploads-specific empty message', () => {
    const wrapper = mountTab('uploads');
    expect(grid(wrapper).props('emptyMessage')).toContain('uploaded');
  });

  it('uses a favorites-specific empty message', () => {
    const wrapper = mountTab('favorites');
    expect(grid(wrapper).props('emptyMessage')).toContain('favorited');
  });

  it('forwards the query error message to the grid', () => {
    queryError.value = new Error('kaboom');
    const wrapper = mountTab('uploads');
    expect(grid(wrapper).props('error')).toBe('kaboom');
  });

  it('offers a Load more control while more images remain than are loaded', () => {
    const wrapper = mountTab('uploads');
    expect(loadMoreButton(wrapper)).toBeTruthy();
  });

  it('does not offer Load more once every image is loaded', () => {
    const wrapper = mountTab('favorites');
    expect(loadMoreButton(wrapper)).toBeUndefined();
  });

  it('requests the next page offset when Load more is clicked', async () => {
    const wrapper = mountTab('uploads');
    await loadMoreButton(wrapper)!.trigger('click');
    expect(fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ offset: 24 }),
      })
    );
  });
});
