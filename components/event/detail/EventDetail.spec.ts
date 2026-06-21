import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  configureApolloMocks,
} from '@/tests/utils/mockApollo';
import { makeEvent } from '@/tests/utils/factories';
import type { Event, EventChannel } from '@/__generated__/graphql';

import { useQuery } from '@vue/apollo-composable';

import EventDetail from '@/components/event/detail/EventDetail.vue';

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({ params: {}, query: {} })),
  useHead: vi.fn(),
}));
vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useModProfileName: () => ref(''),
    useUsername: () => ref(''),
    setModProfileName: vi.fn(),
    setUsername: vi.fn(),
  };
});

const eventChannel = {
  id: 'ec1',
  channelUniqueName: 'cats',
  archived: false,
  Channel: { uniqueName: 'cats', displayName: 'Cats', __typename: 'Channel' },
  __typename: 'EventChannel',
} as unknown as EventChannel;

const stubs = {
  ErrorBanner: { props: ['text'], template: '<div class="error-stub">{{ text }}</div>' },
  EventHeader: { template: '<div class="event-header-stub" />' },
  EventBody: { template: '<div class="event-body-stub" />' },
  EventFooter: { template: '<div class="event-footer-stub" />' },
  ExpandableImage: { template: '<div />' },
  EventCommentsWrapper: { template: '<div class="event-comments-stub" />' },
  EventRootCommentFormWrapper: { template: '<div />' },
  EventChannelLinks: { template: '<div class="event-channel-links-stub" />' },
  AddToCalendarButton: { template: '<div />' },
  ArchivedEventInfoBanner: { template: '<div class="archived-banner-stub" />' },
  Tag: { template: '<span />' },
};

const setup = (params: {
  event?: Event | null;
  eventLoading?: boolean;
  eventError?: Error | null;
} = {}) => {
  const { event = makeEvent(), eventLoading = false, eventError = null } = params;
  configureApolloMocks({
    useQuery,
    queries: {
      'getEvent(': createQueryMock(
        { events: event ? [event] : [] },
        { loading: ref(eventLoading), error: ref(eventError) }
      ),
      getEventComments: {
        ...createQueryMock({ getEventComments: { Comments: [], Event: event } }),
        fetchMore: vi.fn(),
      } as ReturnType<typeof createQueryMock>,
      getEventChannelID: createQueryMock({ eventChannels: [eventChannel] }),
      getEventRootCommentAggregate: createQueryMock({
        events: [{ CommentsAggregate: { count: 0 } }],
      }),
    },
  });
  return mountWithDefaults(EventDetail, {
    props: { eventId: 'e1', channelUniqueName: 'cats' },
    global: { stubs },
  });
};

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useQuery).mockReset();
  });

  it('shows the loading state before the event arrives', () => {
    const wrapper = setup({ event: null, eventLoading: true });
    expect(wrapper.text()).toContain('Loading...');
  });

  it('renders the error banner when the event query errors', () => {
    const wrapper = setup({ event: null, eventError: new Error('boom') });
    expect(wrapper.find('.error-stub').text()).toContain('boom');
  });

  it('shows the not-found message when the event is missing', () => {
    const wrapper = setup({ event: null, eventLoading: false });
    expect(wrapper.text()).toContain("Can't find the content that was reported");
  });

  it('renders the event header once the event loads', () => {
    const wrapper = setup();
    expect(wrapper.find('.event-header-stub').exists()).toBe(true);
  });

  it('renders the event body for a loaded event', () => {
    const wrapper = setup();
    expect(wrapper.find('.event-body-stub').exists()).toBe(true);
  });
});
