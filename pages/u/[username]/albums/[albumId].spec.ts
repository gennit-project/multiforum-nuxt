import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import AlbumDetailPage from './[albumId].vue';

vi.stubGlobal('definePageMeta', vi.fn());

const h = vi.hoisted(() => ({
  route: { params: { username: 'alice', albumId: 'al1' } as Record<string, unknown> },
  resultRef: null as unknown as { value: unknown },
  loadingRef: null as unknown as { value: boolean },
  errorRef: null as unknown as { value: unknown },
  copyUrl: null as unknown as ReturnType<typeof vi.fn>,
}));

vi.mock('nuxt/app', () => ({ useRoute: () => h.route, useHead: vi.fn() }));

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

vi.mock('@/composables/useCopyCurrentUrl', async () => {
  const { ref } = await import('vue');
  h.copyUrl = vi.fn();
  return {
    useCopyCurrentUrl: () => ({
      showCopiedNotification: ref(false),
      copyCurrentUrl: h.copyUrl,
    }),
  };
});

vi.mock('@/graphQLData/image/queries', () => ({ GET_ALBUM_DETAILS: 'q' }));

const stubs = {
  AlbumThumbnailGrid: {
    name: 'AlbumThumbnailGrid',
    props: ['images'],
    template: '<div class="thumb-grid" />',
  },
  Notification: { name: 'Notification', props: ['show', 'title'], template: '<div />' },
  LinkIcon: { template: '<i />' },
};

const mountAlbum = () => mountWithDefaults(AlbumDetailPage, { global: { stubs } });

const setAlbum = (album: Record<string, unknown> | null) => {
  h.resultRef.value = { albums: album ? [album] : [] };
};

const baseAlbum = (over: Record<string, unknown> = {}) => ({
  id: 'al1',
  Owner: { username: 'alice', displayName: 'Alice' },
  Images: [
    { id: 'a', url: 'u/a' },
    { id: 'b', url: 'u/b' },
    { id: 'c', url: 'u/c' },
  ],
  imageOrder: ['a', 'b', 'c'],
  Discussions: [],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  h.route = { params: { username: 'alice', albumId: 'al1' } };
  h.resultRef.value = null;
  h.loadingRef.value = false;
  h.errorRef.value = null;
});

describe('Album detail page', () => {
  it('shows the loading state', () => {
    h.loadingRef.value = true;
    expect(mountAlbum().text()).toContain('Loading album');
  });

  it('shows the not-found state when the album is missing', () => {
    setAlbum(null);
    expect(mountAlbum().text()).toContain('Album Not Found');
  });

  it('shows the not-found state on query error', () => {
    h.errorRef.value = { message: 'boom' };
    expect(mountAlbum().text()).toContain('Album Not Found');
  });

  it('warns when the album belongs to a different user', () => {
    setAlbum(baseAlbum({ Owner: { username: 'bob' } }));
    const wrapper = mountAlbum();
    expect(wrapper.text()).toContain('Invalid URL');
    expect(wrapper.text()).toContain('bob');
  });

  it('renders the album with its owner and image count', () => {
    setAlbum(baseAlbum());
    const wrapper = mountAlbum();
    expect(wrapper.text()).toContain('Album by Alice');
    expect(wrapper.text()).toContain('Images (3)');
  });

  it('orders the images by imageOrder', () => {
    setAlbum(baseAlbum({ imageOrder: ['c', 'a'] }));
    const wrapper = mountAlbum();
    const images = wrapper
      .findComponent({ name: 'AlbumThumbnailGrid' })
      .props('images') as Array<{ id: string }>;
    expect(images.map((i) => i.id)).toEqual(['c', 'a']);
  });

  it('copies the album link when Share is clicked', async () => {
    setAlbum(baseAlbum());
    const wrapper = mountAlbum();
    await wrapper.get('button').trigger('click');
    expect(h.copyUrl).toHaveBeenCalled();
  });

  it('shows a related discussion when present', () => {
    setAlbum(
      baseAlbum({
        Discussions: [
          {
            id: 'd1',
            title: 'Trip photos',
            DiscussionChannels: [{ channelUniqueName: 'cats' }],
            Author: { username: 'alice' },
          },
        ],
      })
    );
    const wrapper = mountAlbum();
    expect(wrapper.text()).toContain('Related Discussion');
    expect(wrapper.text()).toContain('Trip photos');
  });
});
