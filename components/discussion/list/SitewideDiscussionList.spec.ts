import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  mockByDocument,
} from '@/tests/utils/mockApollo';

import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';

// Import after mocks are declared (hoisted) so the component picks them up.
import SitewideDiscussionList from '@/components/discussion/list/SitewideDiscussionList.vue';

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(),
  useState: (_k, init) => ref(init ? init() : undefined),
}));
vi.mock('@/composables/useTheme', () => ({
  useAppTheme: () => ({ theme: ref('light') }),
}));

const SERVER_CONFIG = { serverConfigs: [{ serverName: 'Test', __typename: 'ServerConfig' }] };

const makeDiscussion = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: `Discussion ${id}`,
  score: 0,
  DiscussionChannels: [
    { channelUniqueName: 'cats', CommentsAggregate: { count: 2 }, __typename: 'DiscussionChannel' },
  ],
  __typename: 'Discussion',
  ...overrides,
});

const listResult = (discussions: ReturnType<typeof makeDiscussion>[], aggregate?: number) => ({
  getSiteWideDiscussionList: {
    discussions,
    aggregateDiscussionCount: aggregate ?? discussions.length,
    __typename: 'DiscussionListResponse',
  },
});

const stubs = {
  SitewideDiscussionListItem: {
    name: 'SitewideDiscussionListItem',
    props: ['discussion'],
    emits: ['filterByTag', 'filterByChannel'],
    template: '<li class="item-stub" />',
  },
  SitewideDiscussionSidebar: { template: '<div />' },
  DiscussionDetailContent: { template: '<div class="detail-stub" />' },
  DiscussionDetailEmptyState: { template: '<div class="empty-state-stub" />' },
  LoadMore: {
    name: 'LoadMore',
    props: ['loading', 'reachedEndOfResults'],
    emits: ['loadMore'],
    template: '<button class="load-more-stub" @click="$emit(\'loadMore\')" />',
  },
  ErrorBanner: { props: ['text'], template: '<div class="error-stub">{{ text }}</div>' },
  'v-skeleton-loader': { template: '<div class="skeleton-stub" />' },
  NuxtLink: { template: '<a><slot /></a>' },
};

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
  return mountWithDefaults(SitewideDiscussionList, { global: { stubs } });
};

describe('SitewideDiscussionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list item per discussion', () => {
    setupQueries(createQueryMock(listResult([makeDiscussion('1'), makeDiscussion('2')])));
    const wrapper = mountList();
    expect(wrapper.findAll('.item-stub')).toHaveLength(2);
  });

  it('shows the empty message when there are no discussions', () => {
    setupQueries(createQueryMock(listResult([])));
    const wrapper = mountList();
    expect(wrapper.text()).toContain('There are no discussions to show.');
  });

  it('renders the error banner when the query errors', () => {
    setupQueries(
      createQueryMock(listResult([]), { error: ref(new Error('boom')) })
    );
    const wrapper = mountList();
    expect(wrapper.find('.error-stub').text()).toContain('boom');
  });

  it('shows the skeleton loader while loading with no results', () => {
    setupQueries(createQueryMock(null, { loading: ref(true) }));
    const wrapper = mountList();
    expect(wrapper.find('.skeleton-stub').exists()).toBe(true);
  });

  it('calls fetchMore when LoadMore emits loadMore', async () => {
    const fetchMore = vi.fn();
    setupQueries(
      createQueryMock(listResult([makeDiscussion('1')], 5), {
        // fetchMore isn't part of the canonical mock; attach it.
        ...({ fetchMore } as object),
      })
    );
    const wrapper = mountList();
    await wrapper.find('.load-more-stub').trigger('click');
    expect(fetchMore).toHaveBeenCalledTimes(1);
  });

  it('re-emits filterByTag from a list item', () => {
    setupQueries(createQueryMock(listResult([makeDiscussion('1')])));
    const wrapper = mountList();
    wrapper.findComponent(stubs.SitewideDiscussionListItem).vm.$emit('filterByTag', 'vue');
    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['vue']);
  });

  it('builds comment-section links for the selected discussion', () => {
    setupQueries(createQueryMock(listResult([makeDiscussion('1')])));
    const wrapper = mountList({ query: { selectedDiscussionId: '1' } });
    expect(wrapper.text()).toContain('2 comments');
  });
});
