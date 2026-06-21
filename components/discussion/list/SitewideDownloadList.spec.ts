import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  mockByDocument,
} from '@/tests/utils/mockApollo';

import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';

import SitewideDownloadList from '@/components/discussion/list/SitewideDownloadList.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
  useState: (_k, init) => ref(init ? init() : undefined),
}));

const SERVER_CONFIG = { serverConfigs: [{ serverName: 'Test', __typename: 'ServerConfig' }] };

const makeDownload = (id: string) => ({
  id,
  title: `Download ${id}`,
  Author: { username: 'alice', __typename: 'User' },
  __typename: 'Discussion',
});

const listResult = (discussions: ReturnType<typeof makeDownload>[], aggregate?: number) => ({
  getSiteWideDiscussionList: {
    discussions,
    aggregateDiscussionCount: aggregate ?? discussions.length,
    __typename: 'DiscussionListResponse',
  },
});

const stubs = {
  SitewideDownloadListItem: {
    name: 'SitewideDownloadListItem',
    props: ['discussion'],
    emits: ['filterByTag', 'openAlbum'],
    template: '<li class="item-stub" />',
  },
  SitewideDiscussionSidebar: { template: '<div />' },
  DiscussionAlbum: { props: ['album'], template: '<div class="album-stub" />' },
  DownloadSkeletonCard: { template: '<div class="skeleton-stub" />' },
  LoadMore: {
    name: 'LoadMore',
    props: ['loading', 'reachedEndOfResults'],
    emits: ['loadMore'],
    template: '<button class="load-more-stub" @click="$emit(\'loadMore\')" />',
  },
  ErrorBanner: { props: ['text'], template: '<div class="error-stub">{{ text }}</div>' },
  NuxtLink: { template: '<a><slot /></a>' },
};

const replace = vi.fn();

const setupQueries = (discussionMock: ReturnType<typeof createQueryMock>) => {
  asMock(useQuery).mockImplementation(
    mockByDocument(
      {
        getSiteWideDiscussionList: discussionMock,
        serverConfigs: createQueryMock(SERVER_CONFIG),
      },
      createQueryMock({})
    )
  );
};

const mountList = (route: Record<string, unknown> = {}) => {
  asMock(useRoute).mockReturnValue({ params: {}, query: {}, ...route });
  asMock(useRouter).mockReturnValue({ replace });
  return mountWithDefaults(SitewideDownloadList, { global: { stubs } });
};

describe('SitewideDownloadList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a card per download', () => {
    setupQueries(createQueryMock(listResult([makeDownload('1'), makeDownload('2')])));
    const wrapper = mountList();
    expect(wrapper.findAll('.item-stub')).toHaveLength(2);
  });

  it('shows the empty message when there are no downloads', () => {
    setupQueries(createQueryMock(listResult([])));
    const wrapper = mountList();
    expect(wrapper.text()).toContain('There are no downloads to show.');
  });

  it('renders the error banner when the query errors', () => {
    setupQueries(createQueryMock(listResult([]), { error: ref(new Error('kaboom')) }));
    const wrapper = mountList();
    expect(wrapper.find('.error-stub').text()).toContain('kaboom');
  });

  it('shows skeleton cards during the initial load', () => {
    setupQueries(createQueryMock(null, { loading: ref(true) }));
    const wrapper = mountList();
    expect(wrapper.find('.skeleton-stub').exists()).toBe(true);
  });

  it('calls fetchMore when LoadMore emits', async () => {
    const fetchMore = vi.fn();
    setupQueries(createQueryMock(listResult([makeDownload('1')], 5), { ...({ fetchMore } as object) }));
    const wrapper = mountList();
    await wrapper.find('.load-more-stub').trigger('click');
    expect(fetchMore).toHaveBeenCalledTimes(1);
  });

  it('adds the tag to the query when filtering by a new tag', () => {
    setupQueries(createQueryMock(listResult([makeDownload('1')])));
    const wrapper = mountList({ query: {} });
    wrapper.findComponent(stubs.SitewideDownloadListItem).vm.$emit('filterByTag', 'vue');
    expect(replace).toHaveBeenCalledWith({ query: { tags: ['vue'] } });
  });

  it('clears the tag when already filtering by only that tag', () => {
    setupQueries(createQueryMock(listResult([makeDownload('1')])));
    const wrapper = mountList({ query: { tags: 'vue' } });
    wrapper.findComponent(stubs.SitewideDownloadListItem).vm.$emit('filterByTag', 'vue');
    const lastCall = replace.mock.calls.at(-1)?.[0];
    expect(lastCall.query.tags).toBeUndefined();
  });

  it('opens the album lightbox when a child requests it', async () => {
    setupQueries(createQueryMock(listResult([makeDownload('1')])));
    const wrapper = mountList();
    wrapper.findComponent(stubs.SitewideDownloadListItem).vm.$emit('openAlbum', {
      discussion: makeDownload('1'),
      album: { id: 'a1', __typename: 'Album' },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.album-stub').exists()).toBe(true);
  });
});
