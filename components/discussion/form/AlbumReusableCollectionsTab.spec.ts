import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import AlbumReusableCollectionsTab from '@/components/discussion/form/AlbumReusableCollectionsTab.vue';

const {
  usernameRef,
  collectionsResult,
  collectionImagesResult,
  falseRef,
  nullRef,
  fetchMore,
} = vi.hoisted(() => ({
  usernameRef: { value: 'alice' as string },
  collectionsResult: {
    value: {
      users: [
        {
          Collections: [
            { id: 'c1', name: 'Inspiration', itemCount: 3 },
            { id: 'c2', name: 'Memes', itemCount: 1 },
          ],
        },
      ],
    } as Record<string, unknown>,
  },
  collectionImagesResult: {
    value: {
      collections: [
        {
          id: 'c1',
          name: 'Inspiration',
          Images: [
            { id: 'ci-1', url: 'https://img.test/ci1.jpg' },
            { id: 'ci-2', url: 'https://img.test/ci2.jpg' },
          ],
          ImagesAggregate: { count: 30 },
        },
      ],
    } as Record<string, unknown>,
  },
  falseRef: { value: false },
  nullRef: { value: null as Error | null },
  fetchMore: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => usernameRef,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((document: { definitions?: Array<{ name?: { value?: string } }> }) => {
    const opName = document?.definitions?.[0]?.name?.value;
    if (opName === 'GetReusableImageCollections') {
      return { result: collectionsResult, loading: falseRef, error: nullRef };
    }
    return {
      result: collectionImagesResult,
      loading: falseRef,
      error: nullRef,
      fetchMore,
    };
  }),
}));

const GridStub = {
  name: 'AlbumReusableImageGrid',
  props: ['images', 'selectedImageIds', 'isLimitReached', 'loading', 'error', 'emptyMessage'],
  emits: ['add-image'],
  template: '<div class="grid-stub" />',
};

const mountTab = (searchTerm = '') =>
  mountWithDefaults(AlbumReusableCollectionsTab, {
    props: {
      searchTerm,
      selectedImageIds: [],
      isLimitReached: false,
    },
    global: {
      stubs: {
        AlbumReusableImageGrid: GridStub,
        LoadingSpinner: { template: '<div />' },
        ErrorBanner: { props: ['text'], template: '<div />' },
      },
    },
  });

const collectionButtons = (wrapper: ReturnType<typeof mountTab>) =>
  wrapper.findAll('[data-testid="reuse-image-collection-button"]');

const loadMoreButton = (wrapper: ReturnType<typeof mountTab>) =>
  wrapper.findAll('button').find((b) => b.text() === 'Load more');

beforeEach(() => {
  usernameRef.value = 'alice';
  fetchMore.mockClear();
});

describe('AlbumReusableCollectionsTab', () => {
  it('lists a button for each image collection', () => {
    const wrapper = mountTab();
    expect(collectionButtons(wrapper).map((b) => b.text())).toEqual([
      expect.stringContaining('Inspiration'),
      expect.stringContaining('Memes'),
    ]);
  });

  it('filters the collection list by the search term', () => {
    const wrapper = mountTab('meme');
    expect(collectionButtons(wrapper).map((b) => b.text())).toEqual([
      expect.stringContaining('Memes'),
    ]);
  });

  it('shows the selected collection images in the grid after choosing a collection', async () => {
    const wrapper = mountTab();
    await collectionButtons(wrapper)[0].trigger('click');
    expect(
      wrapper.findComponent(GridStub).props('images').map((i: { id: string }) => i.id)
    ).toEqual(['ci-1', 'ci-2']);
  });

  it('returns to the collection list from the back button', async () => {
    const wrapper = mountTab();
    await collectionButtons(wrapper)[0].trigger('click');
    await wrapper.get('button').trigger('click');
    expect(collectionButtons(wrapper).length).toBe(2);
  });

  it('forwards addImage from the grid', async () => {
    const wrapper = mountTab();
    await collectionButtons(wrapper)[0].trigger('click');
    wrapper.findComponent(GridStub).vm.$emit('add-image', { id: 'ci-1' });
    expect(wrapper.emitted('addImage')?.[0]?.[0]).toMatchObject({ id: 'ci-1' });
  });

  it('requests the next page of collection images when Load more is clicked', async () => {
    const wrapper = mountTab();
    await collectionButtons(wrapper)[0].trigger('click');
    await loadMoreButton(wrapper)!.trigger('click');
    expect(fetchMore).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ offset: 24 }),
      })
    );
  });
});
