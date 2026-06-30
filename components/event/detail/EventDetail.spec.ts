import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  configureApolloMocks,
} from '@/tests/utils/mockApollo';
import { makeEvent, makeUser } from '@/tests/utils/factories';
import type { Event, EventChannel } from '@/__generated__/graphql';

import { useQuery } from '@vue/apollo-composable';

import EventDetail from '@/components/event/detail/EventDetail.vue';

const h = vi.hoisted(() => ({
  route: {
    params: { eventId: 'e1', forumId: 'cats' },
    query: {},
    name: undefined as string | undefined,
  },
  username: null as unknown as { value: string },
  modProfileName: null as unknown as { value: string },
}));

vi.mock('@vue/apollo-composable', () => ({ useQuery: vi.fn() }));
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => h.route),
  useHead: vi.fn(),
}));
vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  h.username = ref('');
  h.modProfileName = ref('');
  return {
    useModProfileName: () => h.modProfileName,
    useUsername: () => h.username,
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
  ErrorBanner: {
    props: ['text'],
    template: '<div class="error-stub">{{ text }}</div>',
  },
  InfoBanner: {
    props: ['text'],
    template: '<div class="info-stub">{{ text }}</div>',
  },
  EventHeader: {
    template: '<button class="event-header-stub" @click="$emit(\'archived-successfully\')" />',
  },
  EventBody: {
    template:
      '<button class="event-body-stub" @click="$emit(\'handle-click-edit-event-description\')" />',
  },
  EventFooter: { template: '<div class="event-footer-stub" />' },
  ExpandableImage: { template: '<div class="expandable-image-stub" />' },
  EventCommentsWrapper: {
    template:
      '<div class="event-comments-stub"><slot /><button class="load-more-stub" @click="$emit(\'load-more\')" /></div>',
  },
  EventRootCommentFormWrapper: {
    template: '<div class="root-comment-form-stub" />',
  },
  EventChannelLinks: {
    template: '<div class="event-channel-links-stub" />',
  },
  ArchivedEventInfoBanner: {
    template: '<div class="archived-banner-stub" />',
  },
  AvatarComponent: { template: '<div class="avatar-stub" />' },
  UsernameWithTooltip: { template: '<div class="username-stub" />' },
  AddToCalendarButton: { template: '<div class="calendar-stub" />' },
  Tag: { template: '<span class="tag-stub" />' },
};

const setup = (params: {
  event?: Event | null;
  eventLoading?: boolean;
  eventError?: Error | null;
  comments?: Array<Record<string, unknown>>;
  routeName?: string;
  routeQuery?: Record<string, unknown>;
  username?: string;
  modProfileName?: string;
  eventChannels?: EventChannel[] | null;
  rootCommentCount?: number;
  rootAggregateLoading?: boolean;
  rootAggregateError?: Error | null;
  showComments?: boolean;
  showTitle?: boolean;
  linkTitle?: boolean;
  usernameOnTop?: boolean;
  issueEventId?: string;
} = {}) => {
  const {
    event = makeEvent(),
    eventLoading = false,
    eventError = null,
    comments = [],
    routeName,
    routeQuery = {},
    username = '',
    modProfileName = '',
    eventChannels = [eventChannel],
    rootCommentCount = 0,
    rootAggregateLoading = false,
    rootAggregateError = null,
    showComments = true,
    showTitle = false,
    linkTitle = false,
    usernameOnTop = false,
    issueEventId = '',
  } = params;

  h.route = {
    params: { eventId: 'e1', forumId: 'cats' },
    query: routeQuery,
    name: routeName,
  };
  h.username.value = username;
  h.modProfileName.value = modProfileName;

  const eventQuery = createQueryMock(
    { events: event ? [event] : [] },
    { loading: ref(eventLoading), error: ref(eventError) }
  );
  const commentsQuery = createQueryMock(
    {
      getEventComments: {
        Comments: comments,
        Event: event,
      },
    },
    { fetchMore: vi.fn(), refetch: vi.fn(), loading: ref(false) }
  );
  const channelQuery = createQueryMock({
    eventChannels: eventChannels ?? [],
  });
  const aggregateQuery = createQueryMock(
    {
      events: [
        {
          CommentsAggregate: {
            count: rootCommentCount,
          },
        },
      ],
    },
    {
      loading: ref(rootAggregateLoading),
      error: ref(rootAggregateError),
    }
  );

  configureApolloMocks({
    useQuery,
    queries: {
      'getEvent(': eventQuery,
      getEventComments: commentsQuery,
      getEventChannel: channelQuery,
      getEventChannelID: channelQuery,
      getEventRootCommentAggregate: aggregateQuery,
    },
  });

  const wrapper = mountWithDefaults(EventDetail, {
    props: {
      eventId: 'e1',
      channelUniqueName: 'cats',
      showComments,
      showTitle,
      linkTitle,
      usernameOnTop,
      issueEventId,
    },
    global: { stubs },
  });

  return { wrapper, eventQuery, commentsQuery, channelQuery, aggregateQuery };
};

describe('EventDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useQuery).mockReset();
    h.route = {
      params: { eventId: 'e1', forumId: 'cats' },
      query: {},
      name: undefined,
    };
    h.username = ref('');
    h.modProfileName = ref('');
  });

  it('shows the loading state before the event arrives', () => {
    const { wrapper } = setup({ event: null, eventLoading: true });

    expect(wrapper.text()).toContain('Loading...');
  });

  it('renders the error banner when the event query errors', () => {
    const { wrapper } = setup({ event: null, eventError: new Error('boom') });

    expect(wrapper.find('.error-stub').text()).toContain('boom');
  });

  it('shows the not-found message when the event is missing', () => {
    const { wrapper } = setup({ event: null, eventLoading: false });

    expect(wrapper.text()).toContain("Can't find the content that was reported");
  });

  it('emits the original poster username from the event query result', () => {
    const event = makeEvent({ Poster: makeUser({ username: 'alice' }) });
    const { eventQuery } = setup({ event });
    const callback = eventQuery.onResult.mock.calls[0]?.[0];

    callback?.({ data: { events: [event] } });

    expect(callback).toBeTypeOf('function');
  });

  it('renders the event header once the event loads', () => {
    const { wrapper } = setup();

    expect(wrapper.find('.event-header-stub').exists()).toBe(true);
  });

  it('renders the event body for a loaded event', () => {
    const { wrapper } = setup();

    expect(wrapper.find('.event-body-stub').exists()).toBe(true);
  });

  it('shows the archived and past banners for archived past events', () => {
    const archivedChannel = { ...eventChannel, archived: true };
    const event = makeEvent({
      startTime: '2024-01-01T00:00:00.000Z',
      endTime: '2024-01-01T01:00:00.000Z',
      EventChannels: [archivedChannel],
    });
    const { wrapper } = setup({
      event,
      eventChannels: [archivedChannel],
      rootCommentCount: 1,
      comments: [{ id: 'c1' }],
      showTitle: true,
    });

    expect([
      wrapper.find('.archived-banner-stub').exists(),
      wrapper.text().includes('This event is in the past.'),
      wrapper.text().includes('Test Event'),
    ]).toEqual([true, true, true]);
  });

  it('hides the archived banner on the issue route', () => {
    const event = makeEvent({ EventChannels: [eventChannel] });
    const { wrapper } = setup({
      event,
      routeName: 'forums-forumId-issues-issueNumber',
      showTitle: true,
    });

    expect(wrapper.find('.archived-banner-stub').exists()).toBe(false);
  });

  it('renders a linked title when linkTitle is enabled', () => {
    const { wrapper } = setup({
      showTitle: true,
      linkTitle: true,
    });

    expect(wrapper.find('a').exists()).toBe(true);
  });

  it('uses the issue-event link variant when issueEventId is provided', () => {
    const { wrapper } = setup({
      showTitle: true,
      issueEventId: 'issue-1',
    });

    expect(wrapper.find('a').exists()).toBe(true);
  });

  it('shows the username-on-top author link when enabled', () => {
    const event = makeEvent({ Poster: makeUser({ username: 'alice' }) });
    const { wrapper } = setup({
      event,
      username: 'alice',
      usernameOnTop: true,
    });

    expect(wrapper.find('.username-stub').exists()).toBe(true);
  });

  it('renders the comments wrapper and root comment form when comments are shown', () => {
    const { wrapper } = setup({
      event: makeEvent({ EventChannels: [eventChannel] }),
      rootCommentCount: 2,
      comments: [{ id: 'c1' }],
    });

    expect([
      wrapper.find('.event-comments-stub').exists(),
      wrapper.find('.root-comment-form-stub').exists(),
    ]).toEqual([true, true]);
  });

  it('hides the root comment form when the event is archived', () => {
    const archivedChannel = { ...eventChannel, archived: true };
    const event = makeEvent({ EventChannels: [archivedChannel] });
    const { wrapper } = setup({
      event,
      eventChannels: [archivedChannel],
      rootCommentCount: 1,
      comments: [{ id: 'c1' }],
    });

    expect(wrapper.find('.root-comment-form-stub').exists()).toBe(false);
  });

  it('emits load-more through the comments wrapper', async () => {
    const { wrapper, commentsQuery } = setup({
      event: makeEvent({ EventChannels: [eventChannel] }),
      rootCommentCount: 2,
      comments: [{ id: 'c1' }],
    });

    await wrapper.find('.event-comments-stub .load-more-stub').trigger('click');

    expect(commentsQuery.fetchMore).toHaveBeenCalled();
  });

  it('refetches channel data when the header reports archive success', async () => {
    const { wrapper, channelQuery } = setup();

    await wrapper.get('.event-header-stub').trigger('click');

    expect(channelQuery.refetch).toHaveBeenCalled();
  });

  it('shows the event channel links when channels are present', () => {
    const { wrapper } = setup({
      event: makeEvent({ EventChannels: [eventChannel] }),
    });

    expect(wrapper.find('.event-channel-links-stub').exists()).toBe(true);
  });

  it('shows the expand image control when a cover image is present', () => {
    const { wrapper } = setup({
      event: makeEvent({
        coverImageURL: 'https://example.com/cover.png',
      }),
    });

    expect(wrapper.find('.expandable-image-stub').exists()).toBe(true);
  });
});
