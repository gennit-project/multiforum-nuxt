import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import ImagesPage from './index.vue';

const h = vi.hoisted(() => ({
  route: { params: { username: 'alice' } as Record<string, unknown> },
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
  fetchMore: null as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.resultRef = ref(null);
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  h.fetchMore = vi.fn();
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
      fetchMore: h.fetchMore,
    }),
  };
});

vi.mock('@/composables/useSelectedChannelsFromQuery', async () => {
  const { ref } = await import('vue');
  return {
    useSelectedChannelsFromQuery: () => ({
      selectedChannels: ref([]),
      hasSelectedChannels: ref(false),
    }),
  };
});

vi.mock('@/graphQLData/image/queries', () => ({ GET_USER_IMAGES: 'q' }));
vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useUsername: () => ref('viewer') };
});

const stubs = {
  ImageListItem: {
    name: 'ImageListItem',
    props: ['image', 'username', 'initialIsFavorited'],
    template: '<div class="image-item" />',
  },
};

const mountImages = () => mountWithDefaults(ImagesPage, { global: { stubs } });

const withImages = (images: unknown[], total = images.length) => {
  h.resultRef.value = {
    users: [{ username: 'alice', Images: images, ImagesAggregate: { count: total } }],
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { username: 'alice' } };
  h.resultRef.value = null;
  h.loadingRef.value = false;
  h.errorRef.value = null;
});

describe('User images page', () => {
  it('shows the loading state before any images arrive', () => {
    h.loadingRef.value = true;
    expect(mountImages().text()).toContain('Loading images');
  });

  it('shows the error state when the query fails', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountImages().text()).toContain('Error Loading Images');
  });

  it('shows the empty state when the user has no images', () => {
    withImages([]);
    const wrapper = mountImages();
    expect(wrapper.text()).toContain('No Images Yet');
    expect(wrapper.text()).toContain('alice');
  });

  it('renders an ImageListItem per image', () => {
    withImages([{ id: 'i1' }, { id: 'i2' }]);
    const wrapper = mountImages();
    expect(wrapper.findAllComponents({ name: 'ImageListItem' })).toHaveLength(2);
  });

  it('passes computed favorite state to image items', () => {
    withImages([{ id: 'i1', isFavorited: true }]);
    const wrapper = mountImages();
    expect(
      wrapper.getComponent({ name: 'ImageListItem' }).props('initialIsFavorited')
    ).toBe(true);
  });

  it('shows the load-more button when more images remain', () => {
    withImages([{ id: 'i1' }], 5);
    const wrapper = mountImages();
    expect(wrapper.text()).toContain('Load More Images');
  });

  it('hides the load-more button when all images are loaded', () => {
    withImages([{ id: 'i1' }], 1);
    const wrapper = mountImages();
    expect(wrapper.text()).not.toContain('Load More Images');
  });

  it('fetches more images when load-more is clicked', async () => {
    withImages([{ id: 'i1' }], 5);
    const wrapper = mountImages();
    await wrapper.get('button').trigger('click');
    expect(h.fetchMore).toHaveBeenCalled();
  });
});
