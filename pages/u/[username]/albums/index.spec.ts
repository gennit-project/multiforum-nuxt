import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AlbumsPage from './index.vue';

const h = vi.hoisted(() => ({
  route: { params: { username: 'alice' } as Record<string, unknown> },
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));

vi.mock('@vue/apollo-composable', async () => {
  const { ref } = await import('vue');
  h.resultRef = ref(null);
  h.loadingRef = ref(false);
  h.errorRef = ref(null);
  return {
    useQuery: () => ({
      result: h.resultRef,
      loading: h.loadingRef,
      error: h.errorRef,
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

vi.mock('@/graphQLData/image/queries', () => ({ GET_USER_ALBUMS: 'q' }));

const mountAlbums = () => mountWithDefaults(AlbumsPage);

const album = (over: Record<string, unknown> = {}) => ({
  id: 'al1',
  Owner: { username: 'alice' },
  Images: [{ id: 'im1', url: 'https://img/1.png', createdAt: '2024-01-01' }],
  imageOrder: ['im1'],
  Discussions: [{ createdAt: '2024-01-01' }],
  ...over,
});

const withAlbums = (albums: unknown[]) => {
  h.resultRef.value = { albums };
};

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { username: 'alice' } };
  h.resultRef.value = null;
  h.loadingRef.value = false;
  h.errorRef.value = null;
});

describe('User albums page', () => {
  it('shows the loading state before albums arrive', () => {
    h.loadingRef.value = true;
    expect(mountAlbums().text()).toContain('Loading albums');
  });

  it('shows the error state when the query fails', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountAlbums().text()).toContain('Error loading albums');
  });

  it('shows the empty state when there are no albums', () => {
    withAlbums([]);
    const wrapper = mountAlbums();
    expect(wrapper.text()).toContain("hasn't created any albums yet");
    expect(wrapper.text()).toContain('alice');
  });

  it('renders owned albums with a count and links', () => {
    withAlbums([album({ id: 'al1' })]);
    const wrapper = mountAlbums();
    expect(wrapper.text()).toContain('Albums (1)');
    expect(wrapper.findAll('a').length).toBe(1);
  });

  it('separates owned albums from albums owned by others', () => {
    withAlbums([
      album({ id: 'mine', Owner: { username: 'alice' } }),
      album({ id: 'theirs', Owner: { username: 'bob' } }),
    ]);
    const wrapper = mountAlbums();
    // One owned ("Albums (1)") plus one other -> two album links total.
    expect(wrapper.text()).toContain('Albums (1)');
    expect(wrapper.findAll('a').length).toBe(2);
  });

  it('shows a "No images" placeholder for an album with no images', () => {
    withAlbums([album({ id: 'al1', Images: [], imageOrder: [] })]);
    const wrapper = mountAlbums();
    expect(wrapper.text()).toContain('No images');
  });
});
