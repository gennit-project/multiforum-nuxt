import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import DownloadList from '@/components/channel/DownloadList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  refetch: vi.fn(),
  fetchMore: vi.fn(),
  route: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    refetch: h.refetch,
    fetchMore: h.fetchMore,
  }),
}));
vi.mock('nuxt/app', () => ({ useRoute: () => h.route }));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => ref('') }));

const channel = (id: string) => ({
  id: `dc-${id}`,
  discussionId: id,
  Discussion: { id, title: `Download ${id}`, Album: { Images: [] } },
});

const resultWith = (channels: unknown[], aggregate = channels.length) => ({
  getDiscussionsInChannel: {
    discussionChannels: channels,
    aggregateDiscussionChannelsCount: aggregate,
  },
});

const mountList = () =>
  mount(DownloadList, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        ChannelDownloadListItem: {
          name: 'ChannelDownloadListItem',
          props: ['discussion', 'discussionChannel'],
          emits: ['filter-by-tag', 'filter-by-channel', 'open-album'],
          template: '<li />',
        },
        LoadMore: {
          name: 'LoadMore',
          props: ['loading', 'reachedEndOfResults'],
          emits: ['load-more'],
          template: '<div />',
        },
        DiscussionAlbum: {
          name: 'DiscussionAlbum',
          props: ['album', 'discussionId'],
          emits: ['close-lightbox'],
          template: '<div />',
        },
        DownloadSkeletonCard: { name: 'DownloadSkeletonCard', template: '<div class="skeleton" />' },
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err" />' },
        RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
        ClientOnly: { template: '<div><slot /></div>' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(resultWith([channel('d1')]));
  h.error = ref(null);
  h.loading = ref(false);
  h.route = { params: { forumId: 'cats' }, query: {} };
});

describe('DownloadList states', () => {
  it('shows skeleton cards while loading with no results', () => {
    h.result = ref(null);
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.find('.skeleton').exists()).toBe(true);
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.find('.err').exists()).toBe(true);
  });

  it('shows an empty message when there are no downloads', () => {
    h.result = ref(resultWith([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('There are no downloads yet');
  });

  it('renders an item per download', () => {
    h.result = ref(resultWith([channel('d1'), channel('d2')]));
    const wrapper = mountList();

    expect(
      wrapper.findAllComponents({ name: 'ChannelDownloadListItem' })
    ).toHaveLength(2);
  });
});

describe('DownloadList pagination', () => {
  it('fetches more on request', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    expect(h.fetchMore).toHaveBeenCalled();
  });

  it('reports the end of results when all rows are loaded', () => {
    h.result = ref(resultWith([channel('d1')], 1));
    const wrapper = mountList();

    expect(
      wrapper.getComponent({ name: 'LoadMore' }).props('reachedEndOfResults')
    ).toBe(true);
  });
});

describe('DownloadList filter events', () => {
  it('re-emits filterByTag', async () => {
    const wrapper = mountList();

    await wrapper
      .getComponent({ name: 'ChannelDownloadListItem' })
      .vm.$emit('filter-by-tag', 'stl');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['stl']);
  });

  it('re-emits filterByChannel', async () => {
    const wrapper = mountList();

    await wrapper
      .getComponent({ name: 'ChannelDownloadListItem' })
      .vm.$emit('filter-by-channel', 'cats');

    expect(wrapper.emitted('filterByChannel')?.[0]).toEqual(['cats']);
  });
});

describe('DownloadList album lightbox', () => {
  it('opens the album lightbox on open-album', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'ChannelDownloadListItem' }).vm.$emit('open-album', {
      discussion: { id: 'd1' },
      album: { Images: [{ id: 'i1' }] },
    });

    expect(wrapper.findComponent({ name: 'DiscussionAlbum' }).exists()).toBe(true);
  });

  it('closes the album lightbox', async () => {
    const wrapper = mountList();
    await wrapper.getComponent({ name: 'ChannelDownloadListItem' }).vm.$emit('open-album', {
      discussion: { id: 'd1' },
      album: { Images: [{ id: 'i1' }] },
    });

    await wrapper.getComponent({ name: 'DiscussionAlbum' }).vm.$emit('close-lightbox');

    expect(wrapper.findComponent({ name: 'DiscussionAlbum' }).exists()).toBe(false);
  });
});
