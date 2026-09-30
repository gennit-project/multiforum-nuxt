import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
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

const SERVER_CONFIG = {
  serverConfigs: [{ serverName: 'Test', __typename: 'ServerConfig' }],
};

const makeDiscussion = (
  id: string,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  title: `Discussion ${id}`,
  score: 0,
  DiscussionChannels: [
    {
      channelUniqueName: 'cats',
      CommentsAggregate: { count: 2 },
      __typename: 'DiscussionChannel',
    },
  ],
  __typename: 'Discussion',
  ...overrides,
});

const listResult = (
  discussions: ReturnType<typeof makeDiscussion>[],
  aggregate?: number
) => ({
  getSiteWideDiscussionList: {
    discussions,
    aggregateDiscussionCount: aggregate ?? discussions.length,
    pageInfo: {
      endCursor:
        discussions.length > 0 ? `cursor-${discussions.at(-1)?.id}` : null,
      hasNextPage: (aggregate ?? discussions.length) > discussions.length,
      __typename: 'DiscussionListPageInfo',
    },
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
  DiscussionDetailContent: {
    props: ['channelId', 'showComments'],
    template: '<div class="detail-stub"><slot name="before-comments" /></div>',
  },
  DiscussionDetailEmptyState: { template: '<div class="empty-state-stub" />' },
  LoadMore: {
    name: 'LoadMore',
    props: ['loading', 'reachedEndOfResults'],
    emits: ['loadMore'],
    template: '<button class="load-more-stub" @click="$emit(\'loadMore\')" />',
  },
  ErrorBanner: {
    props: ['text'],
    template: '<div class="error-stub">{{ text }}</div>',
  },
  SkeletonLoader: { template: '<div class="skeleton-stub" />' },
  NuxtLink: {
    name: 'NuxtLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
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
  return mountWithDefaults(SitewideDiscussionList, {
    global: { stubs },
    slots: {
      default:
        '<template #default="{ openAbout }"><button @click="openAbout">About</button></template>',
    },
  });
};

describe('SitewideDiscussionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a list item per discussion', () => {
    setupQueries(
      createQueryMock(listResult([makeDiscussion('1'), makeDiscussion('2')]))
    );
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

  // Regression: a query-variable change after hydration (e.g. the logged-in
  // username resolving client-side) makes Apollo clear `result` while the
  // refetch is in flight. The list must stay put instead of collapsing back to
  // the skeleton — the "content -> skeleton -> content" flash.
  it('does not flash the skeleton during an in-flight refetch when a page was already loaded', async () => {
    const discussionMock = createQueryMock(
      listResult([makeDiscussion('1'), makeDiscussion('2')])
    );
    setupQueries(discussionMock);
    const wrapper = mountList();
    discussionMock.result.value = null;
    discussionMock.loading.value = true;
    await nextTick();
    expect(wrapper.find('.skeleton-stub').exists()).toBe(false);
  });

  it('keeps rendering the previously loaded discussions during an in-flight refetch', async () => {
    const discussionMock = createQueryMock(
      listResult([makeDiscussion('1'), makeDiscussion('2')])
    );
    setupQueries(discussionMock);
    const wrapper = mountList();
    discussionMock.result.value = null;
    discussionMock.loading.value = true;
    await nextTick();
    expect(wrapper.findAll('.item-stub')).toHaveLength(2);
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

  it('loads the next discussion page from the returned cursor', async () => {
    const fetchMore = vi.fn();
    setupQueries(
      createQueryMock(listResult([makeDiscussion('1')], 5), {
        ...({ fetchMore } as object),
      })
    );
    const wrapper = mountList();

    await wrapper.find('.load-more-stub').trigger('click');

    expect(fetchMore.mock.calls[0][0].variables.options).toEqual({
      after: 'cursor-1',
      limit: 15,
      sort: 'hot',
      timeFrame: 'month',
    });
  });

  it('re-emits filterByTag from a list item', () => {
    setupQueries(createQueryMock(listResult([makeDiscussion('1')])));
    const wrapper = mountList();
    wrapper
      .findComponent(stubs.SitewideDiscussionListItem)
      .vm.$emit('filterByTag', 'vue');
    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['vue']);
  });

  it('builds comment-section links for the selected discussion', () => {
    setupQueries(createQueryMock(listResult([makeDiscussion('1')])));
    const wrapper = mountList({ query: { selectedDiscussionId: '1' } });
    expect(wrapper.find('[aria-label="cats: 2 comments"]').exists()).toBe(true);
  });

  it('navigates in place rather than opening a new tab from the comment-section link', () => {
    setupQueries(createQueryMock(listResult([makeDiscussion('1')])));
    const wrapper = mountList({ query: { selectedDiscussionId: '1' } });
    const commentLink = wrapper
      .findAllComponents({ name: 'NuxtLink' })
      .find((link) => link.attributes('aria-label') === 'cats: 2 comments');
    expect(commentLink?.props('to')).toBe('/forums/cats/discussions/1');
  });

  it('opens the About overlay as a modal dialog', async () => {
    setupQueries(createQueryMock(listResult([])));
    const wrapper = mountList();
    const aboutButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'About');

    await aboutButton!.trigger('click');
    const dialog = wrapper.get('#sitewide-sidebar-drawer');

    expect({
      role: dialog.attributes('role'),
      modal: dialog.attributes('aria-modal'),
      label: dialog.attributes('aria-label'),
    }).toEqual({
      role: 'dialog',
      modal: 'true',
      label: 'About this forum',
    });
  });

  it('closes the About overlay on Escape', async () => {
    setupQueries(createQueryMock(listResult([])));
    const wrapper = mountList();
    const aboutButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'About');
    await aboutButton!.trigger('click');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(wrapper.find('#sitewide-sidebar-drawer').exists()).toBe(false);
  });
});

it('loads the selected forum’s comments, not the first forum’s', () => {
  setupQueries(
    createQueryMock(
      listResult([
        makeDiscussion('1', {
          DiscussionChannels: [
            { channelUniqueName: 'cats', CommentsAggregate: { count: 2 } },
            { channelUniqueName: 'dogs', CommentsAggregate: { count: 5 } },
          ],
        }),
      ])
    )
  );
  const wrapper = mountList({
    query: { selectedDiscussionId: '1', selectedForum: 'dogs' },
  });
  expect(wrapper.findComponent(stubs.DiscussionDetailContent).props()).toEqual({
    channelId: 'dogs',
    showComments: true,
  });
});
it('falls back to an available forum for a stale forum selection', () => {
  setupQueries(createQueryMock(listResult([makeDiscussion('1')])));
  const wrapper = mountList({
    query: { selectedDiscussionId: '1', selectedForum: 'deleted' },
  });
  expect(
    wrapper.findComponent(stubs.DiscussionDetailContent).props('channelId')
  ).toBe('cats');
});
