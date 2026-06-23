import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import type { TestingPinia } from '@pinia/testing';

import ChannelDiscussionList from '@/components/discussion/list/ChannelDiscussionList.vue';
import { useUIStore } from '@/stores/uiStore';

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
vi.mock('@/composables/useTheme', () => ({
  useAppTheme: () => ({ theme: ref('light') }),
}));

const discussionChannel = (id: string, title: string) => ({
  id: `dc-${id}`,
  discussionId: id,
  Discussion: { id, title },
});

const resultWith = (channels: unknown[], aggregate = channels.length) => ({
  getDiscussionsInChannel: {
    discussionChannels: channels,
    aggregateDiscussionChannelsCount: aggregate,
  },
});

const itemStub = {
  name: 'ChannelDiscussionListItem',
  props: ['discussion', 'discussionChannel', 'selectedDiscussionId'],
  emits: ['filter-by-tag', 'filter-by-channel', 'open-mod-profile'],
  template: '<li />',
};
const loadMoreStub = {
  name: 'LoadMore',
  props: ['loading', 'reachedEndOfResults'],
  emits: ['load-more'],
  template: '<div />',
};

let pinia: TestingPinia;

const mountList = () => {
  pinia = createTestingPinia({ createSpy: vi.fn });
  return mount(ChannelDiscussionList, {
    global: {
      plugins: [pinia],
      stubs: {
        ChannelDiscussionListItem: itemStub,
        LoadMore: loadMoreStub,
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err" />' },
        RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
        'v-skeleton-loader': { template: '<div class="skeleton" />' },
      },
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(resultWith([discussionChannel('d1', 'First')]));
  h.error = ref(null);
  h.loading = ref(false);
  h.route = { params: { forumId: 'cats' }, query: {} };
});

describe('ChannelDiscussionList states', () => {
  it('shows skeleton loaders while loading with no result', () => {
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

  it('shows an empty message when there are no discussions', () => {
    h.result = ref(resultWith([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('There are no discussions to show');
  });

  it('renders a list item per discussion channel', () => {
    h.result = ref(
      resultWith([
        discussionChannel('d1', 'First'),
        discussionChannel('d2', 'Second'),
      ])
    );
    const wrapper = mountList();

    expect(
      wrapper.findAllComponents({ name: 'ChannelDiscussionListItem' })
    ).toHaveLength(2);
  });
});

describe('ChannelDiscussionList pagination', () => {
  it('fetches more when LoadMore requests it', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    expect(h.fetchMore).toHaveBeenCalled();
  });

  it('reports the end of results when all rows are loaded', () => {
    h.result = ref(resultWith([discussionChannel('d1', 'First')], 1));
    const wrapper = mountList();

    expect(
      wrapper.getComponent({ name: 'LoadMore' }).props('reachedEndOfResults')
    ).toBe(true);
  });

  it('is not at the end when more results remain', () => {
    h.result = ref(resultWith([discussionChannel('d1', 'First')], 10));
    const wrapper = mountList();

    expect(
      wrapper.getComponent({ name: 'LoadMore' }).props('reachedEndOfResults')
    ).toBe(false);
  });
});

describe('ChannelDiscussionList filter events', () => {
  it('re-emits filterByTag from a list item', async () => {
    const wrapper = mountList();

    await wrapper
      .getComponent({ name: 'ChannelDiscussionListItem' })
      .vm.$emit('filter-by-tag', 'vue');

    expect(wrapper.emitted('filterByTag')?.[0]).toEqual(['vue']);
  });

  it('re-emits filterByChannel from a list item', async () => {
    const wrapper = mountList();

    await wrapper
      .getComponent({ name: 'ChannelDiscussionListItem' })
      .vm.$emit('filter-by-channel', 'cats');

    expect(wrapper.emitted('filterByChannel')?.[0]).toEqual(['cats']);
  });
});

describe('ChannelDiscussionList selected discussion sync', () => {
  it('records the selected discussion in the UI store', () => {
    h.route = {
      params: { forumId: 'cats' },
      query: { selectedDiscussionId: 'd1' },
    };
    h.result = ref(resultWith([discussionChannel('d1', 'First')]));
    mountList();
    const store = useUIStore(pinia);

    expect(store.setSelectedChannelDiscussionSelection).toHaveBeenCalledWith({
      discussionId: 'd1',
      title: 'First',
    });
  });

  it('clears the selection when no discussion is selected', () => {
    mountList();
    const store = useUIStore(pinia);

    expect(store.clearSelectedChannelDiscussion).toHaveBeenCalled();
  });
});
