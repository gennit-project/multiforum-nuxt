import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import EventListView from './EventListView.vue';
import { useQuery } from '@vue/apollo-composable';

const push = vi.fn();
const replace = vi.fn();
const fetchMoreMock = vi.fn();
const clearSelectedChannelEventSelection = vi.fn();
const setSelectedChannelEventSelection = vi.fn();
const mockRoute = {
  path: '/events/list/search/event-1',
  params: {
    eventId: 'event-1',
  },
  query: {},
};

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push,
    replace,
  }),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    clearSelectedChannelEventSelection,
    setSelectedChannelEventSelection,
  }),
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    storeToRefs: () => ({
      selectedChannelEventId: ref(''),
    }),
  };
});

const EventListStub = defineComponent({
  emits: ['select'],
  setup(_, { emit }) {
    return () =>
      h('button', {
        'data-testid': 'event-list-select',
        onClick: () => emit('select', { eventId: 'event-2', title: 'Event Two' }),
      });
  },
});

const EventDetailStub = defineComponent({
  props: ['eventId'],
  setup(props) {
    return () => h('div', { 'data-testid': 'event-detail' }, props.eventId || '');
  },
});

describe('EventListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.path = '/events/list/search/event-1';
    mockRoute.params = { eventId: 'event-1' };
    mockRoute.query = {};

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      error: ref(null),
      result: ref({
        events: [
          {
            id: 'event-1',
            title: 'Event One',
            EventChannels: [{ channelUniqueName: 'forum-1' }],
          },
          {
            id: 'event-2',
            title: 'Event Two',
            EventChannels: [{ channelUniqueName: 'forum-2' }],
          },
        ],
        eventsAggregate: { count: 2 },
      }),
      fetchMore: vi.fn(),
    });
  });

  it('uses the route event id as the selected search event and pushes a new search detail route on selection', async () => {
    const wrapper = mount(EventListView, {
      global: {
        stubs: {
          EventList: EventListStub,
          EventDetail: EventDetailStub,
          EventFilterBar: true,
          TimeShortcuts: true,
          OnlineInPersonShortcuts: true,
          ErrorBanner: true,
          LoadingSpinner: true,
        },
      },
    });

    expect(wrapper.get('[data-testid="event-detail"]').text()).toBe('event-1');

    await wrapper.get('[data-testid="event-list-select"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(push).toHaveBeenCalledWith({
      path: '/events/list/search/event-2',
      query: {},
    });
    expect(wrapper.get('[data-testid="event-detail"]').text()).toBe('event-2');
  });
});

describe('EventListView — filters and navigation', () => {
  const EventListEmitter = defineComponent({
    emits: ['select', 'filter-by-tag', 'filter-by-channel', 'load-more'],
    setup(_, { emit }) {
      return () =>
        h('div', [
          h('button', { 'data-testid': 'tag', onClick: () => emit('filter-by-tag', 'music') }),
          h('button', { 'data-testid': 'chan', onClick: () => emit('filter-by-channel', 'cats') }),
          h('button', { 'data-testid': 'more', onClick: () => emit('load-more') }),
        ]);
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // A search-list route so the filter/map toolbar (v-if isSearchListRoute) renders.
    mockRoute.path = '/events/list/search';
    mockRoute.params = {};
    mockRoute.query = {};
    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      error: ref(null),
      result: ref({ events: [], eventsAggregate: { count: 0 } }),
      fetchMore: fetchMoreMock,
    });
  });

  const mountView = () =>
    mount(EventListView, {
      global: {
        stubs: {
          EventList: EventListEmitter,
          EventDetail: { template: '<div />' },
          EventFilterBar: true,
          TimeShortcuts: true,
          OnlineInPersonShortcuts: true,
          ErrorBanner: true,
          LoadingSpinner: true,
          FilterIcon: true,
          MapIcon: true,
        },
      },
    });

  it('toggles the main filters visibility', async () => {
    const wrapper = mountView();
    await wrapper.get('[data-testid="toggle-main-filters-button"]').trigger('click');

    expect(wrapper.text()).toContain('Show filters');
  });

  it('navigates to the in-person map', async () => {
    const wrapper = mountView();
    const mapButton = wrapper
      .findAll('button')
      .find((b) => b.text().includes('In-person map'))!;
    await mapButton.trigger('click');

    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/map/search' })
    );
  });

  it('updates the query when filtering by tag', async () => {
    const wrapper = mountView();
    await wrapper.get('[data-testid="tag"]').trigger('click');

    expect(replace).toHaveBeenCalled();
  });

  it('updates the query when filtering by channel', async () => {
    const wrapper = mountView();
    await wrapper.get('[data-testid="chan"]').trigger('click');

    expect(replace).toHaveBeenCalled();
  });

  it('fetches more events when load-more is emitted', async () => {
    const wrapper = mountView();
    await wrapper.get('[data-testid="more"]').trigger('click');

    expect(fetchMoreMock).toHaveBeenCalled();
  });
});
