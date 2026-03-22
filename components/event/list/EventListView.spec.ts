import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import EventListView from './EventListView.vue';
import { useQuery } from '@vue/apollo-composable';

const push = vi.fn();
const replace = vi.fn();
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
