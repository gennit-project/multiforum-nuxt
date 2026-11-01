import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reactive, ref, unref } from 'vue';
import { useHead } from 'nuxt/app';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  configureApolloMocks,
} from '@/tests/utils/mockApollo';
import { makeUser } from '@/tests/utils/factories';
import {
  makeEventDetail as makeEvent,
  makeEventSection,
  makeEventRoot,
} from '@/tests/utils/eventCommentFixtures';
import type {
  EventDetailSelection as Event,
  EventChannelPresentation,
} from '@/types/EventPresentation';
import type { GetEventChannelIdQuery } from '@/__generated__/operations';
import {
  GetEventDocument,
  GetEventCommentsDocument,
  GetEventRootCommentAggregateDocument,
  GetEventChannelIdDocument,
} from '@/__generated__/operations';

import { useQuery } from '@vue/apollo-composable';

import EventDetail from '@/components/event/detail/EventDetail.vue';
type EventChannel = EventChannelPresentation &
  GetEventChannelIdQuery['eventChannels'][number];

const h = vi.hoisted(() => ({
  route: {
    params: { eventId: 'e1', forumId: 'cats' } as Record<
      string,
      string | string[]
    >,
    query: {} as Record<string, unknown>,
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
  eventId: 'e1',
  channelUniqueName: 'cats',
  archived: false,
  Channel: { uniqueName: 'cats', displayName: 'Cats', channelIconURL: null },
} satisfies EventChannel;

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
    template:
      '<button class="event-header-stub" @click="$emit(\'archived-successfully\')" />',
  },
  EventBody: {
    name: 'EventBody',
    props: ['eventDescriptionEditMode'],
    emits: [
      'handle-click-edit-event-description',
      'close-edit-event-description',
    ],
    template:
      '<button class="event-body-stub" @click="$emit(\'handle-click-edit-event-description\')" />',
  },
  EventFooter: { template: '<div class="event-footer-stub" />' },
  ExpandableImage: { template: '<div class="expandable-image-stub" />' },
  EventCommentsWrapper: {
    name: 'EventCommentsWrapper',
    props: ['comments', 'reachedEndOfResults', 'loading'],
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

const setup = (
  params: {
    event?: Event | null;
    eventLoading?: boolean;
    eventError?: Error | null;
    comments?: Array<Record<string, unknown>>;
    commentsLoading?: boolean;
    commentsError?: Error | null;
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
  } = {}
) => {
  const {
    event = makeEvent(),
    eventLoading = false,
    eventError = null,
    comments = [],
    commentsLoading = false,
    commentsError = null,
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

  h.route = reactive({
    params: { eventId: 'e1', forumId: 'cats' },
    query: routeQuery,
    name: routeName,
  });
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
    {
      fetchMore: vi.fn(),
      refetch: vi.fn(),
      loading: ref(commentsLoading),
      error: ref(commentsError),
    }
  );
  const channelQuery = createQueryMock({
    eventChannels: eventChannels ?? [],
  });
  const aggregateQuery = createQueryMock(
    {
      events: [
        {
          id: 'e1',
          CommentsConnection: {
            aggregate: { count: { nodes: rootCommentCount } },
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

  // #583: registered once in setup (was a watchEffect), and a real head object
  // (the old one passed description/image keys useHead ignores).
  it('registers the page head exactly once', () => {
    setup();
    expect(useHead).toHaveBeenCalledTimes(1);
  });

  it('emits description and OpenGraph meta for the event', () => {
    setup();
    const head = unref(asMock(useHead).mock.calls[0][0]);
    expect(
      head.meta.map(
        (m: { name?: string; property?: string }) => m.name || m.property
      )
    ).toEqual(
      expect.arrayContaining(['description', 'og:title', 'og:description'])
    );
  });

  it('emits schema.org Event JSON-LD in the script body', () => {
    setup();
    const head = unref(asMock(useHead).mock.calls[0][0]);
    expect(JSON.parse(head.script[0].innerHTML)['@type']).toBe('Event');
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

    expect(wrapper.text()).toContain(
      "Can't find the content that was reported"
    );
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

  it('reloads comments when a username becomes available', async () => {
    const { wrapper, commentsQuery } = setup();
    h.username.value = 'alice';
    await wrapper.vm.$nextTick();
    expect(commentsQuery.refetch).toHaveBeenCalledOnce();
  });

  it('uses the initial query without a duplicate signed-in mount refetch', () => {
    const { commentsQuery } = setup({ username: 'alice' });
    expect(commentsQuery.refetch).not.toHaveBeenCalled();
  });

  it('updates inferred query variables and hides the old event after navigation', async () => {
    const { wrapper } = setup();
    await wrapper.setProps({ eventId: 'e2', channelUniqueName: 'dogs' });
    const calls = asMock(useQuery).mock.calls;
    expect({
      variables: calls
        .filter((call) =>
          [
            GetEventDocument,
            GetEventCommentsDocument,
            GetEventRootCommentAggregateDocument,
            GetEventChannelIdDocument,
          ].includes(call[0])
        )
        .map((call) => call[1]()),
      oldEventVisible: wrapper.find('.event-header-stub').exists(),
    }).toEqual({
      variables: [
        { id: 'e2', channelUniqueName: 'dogs', loggedInModName: '' },
        { eventId: 'e2', offset: 0, limit: 50, sort: 'hot' },
        { eventId: 'e2', channelUniqueName: 'dogs' },
        { eventId: 'e2' },
      ],
      oldEventVisible: false,
    });
  });

  it('merges a fetched page of event comments', async () => {
    const { wrapper, commentsQuery } = setup({ comments: [{ id: 'one' }] });
    await wrapper.find('.load-more-stub').trigger('click');
    const options = commentsQuery.fetchMore.mock.calls[0][0];
    const merged = options.updateQuery(
      { getEventComments: { Event: { id: 'e1' }, Comments: [{ id: 'one' }] } },
      {
        fetchMoreResult: {
          getEventComments: { Event: { id: 'e1' }, Comments: [{ id: 'two' }] },
        },
      }
    );
    expect([options.variables, merged.getEventComments.Comments]).toEqual([
      { eventId: 'e1', sort: 'hot', limit: 50, offset: 1 },
      [{ id: 'one' }, { id: 'two' }],
    ]);
  });

  it('keeps the prior event comments when fetchMore returns nothing', async () => {
    const { wrapper, commentsQuery } = setup({ comments: [{ id: 'one' }] });
    await wrapper.find('.load-more-stub').trigger('click');
    const previous = {
      getEventComments: { Event: { id: 'e1' }, Comments: [{ id: 'one' }] },
    };
    expect(
      commentsQuery.fetchMore.mock.calls[0][0].updateQuery(previous, {})
    ).toBe(previous);
  });

  it('enters and exits description editing from EventBody events', async () => {
    const { wrapper } = setup();
    const body = wrapper.findComponent({ name: 'EventBody' });
    await body.vm.$emit('handle-click-edit-event-description');
    const editing = body.props('eventDescriptionEditMode');
    await body.vm.$emit('close-edit-event-description');
    expect([editing, body.props('eventDescriptionEditMode')]).toEqual([
      true,
      false,
    ]);
  });

  it('renders the edited timestamp when the event has an update time', () => {
    const { wrapper } = setup({
      event: makeEvent({ updatedAt: '2025-01-01T00:00:00.000Z' }),
      usernameOnTop: true,
    });
    expect(wrapper.text()).toContain('Edited');
  });
  it('uses only generated documents for all four migrated reads', () => {
    setup();
    expect(
      asMock(useQuery)
        .mock.calls.filter((call) =>
          [
            GetEventDocument,
            GetEventCommentsDocument,
            GetEventChannelIdDocument,
            GetEventRootCommentAggregateDocument,
          ].includes(call[0])
        )
        .map((call) => call[0])
    ).toEqual([
      GetEventDocument,
      GetEventCommentsDocument,
      GetEventChannelIdDocument,
      GetEventRootCommentAggregateDocument,
    ]);
  });

  it('refreshes scalar sort and moderator variables without appending old pages', async () => {
    const { wrapper, commentsQuery } = setup();
    h.route.query.sort = 'new';
    h.modProfileName.value = 'mod-alice';
    await wrapper.vm.$nextTick();
    const calls = asMock(useQuery).mock.calls;
    expect({
      detail: calls.find((call) => call[0] === GetEventDocument)![1](),
      roots: calls.find((call) => call[0] === GetEventCommentsDocument)![1](),
      pages: commentsQuery.fetchMore.mock.calls.length,
    }).toEqual({
      detail: {
        id: 'e1',
        channelUniqueName: 'cats',
        loggedInModName: 'mod-alice',
      },
      roots: { eventId: 'e1', limit: 50, offset: 0, sort: 'new' },
      pages: 0,
    });
  });

  it.each([undefined, ['e1', 'e2']])(
    'disables the reads for an invalid route ID: %s',
    async (value) => {
      const { wrapper } = setup();
      if (value === undefined) delete h.route.params.eventId;
      else h.route.params.eventId = value;
      await wrapper.setProps({ eventId: '' });
      const calls = asMock(useQuery).mock.calls.filter((call) =>
        [
          GetEventDocument,
          GetEventCommentsDocument,
          GetEventChannelIdDocument,
          GetEventRootCommentAggregateDocument,
        ].includes(call[0])
      );
      expect(
        calls.map((call) => [
          call[1]().id ?? call[1]().eventId,
          unref(call[2].enabled),
        ])
      ).toEqual([
        ['', false],
        ['', false],
        ['', false],
        ['', false],
      ]);
    }
  );

  it('renders a nullable selected fallback while the detail read loads', async () => {
    const { wrapper, commentsQuery } = setup({
      event: null,
      eventLoading: true,
    });
    commentsQuery.result.value = { getEventComments: makeEventSection() };
    await wrapper.vm.$nextTick();
    expect([
      wrapper.find('.event-header-stub').exists(),
      wrapper.find('.event-body-stub').exists(),
    ]).toEqual([true, false]);
  });

  it('surfaces a root-read error while retaining the event detail', () => {
    const { wrapper } = setup({
      commentsError: new Error('Comments unavailable'),
    });
    expect([
      wrapper.text().includes('Comments unavailable'),
      wrapper.find('.event-header-stub').exists(),
    ]).toEqual([true, true]);
  });

  it('does not merge a late page after switching forums', async () => {
    const { wrapper, commentsQuery } = setup();
    await wrapper.find('.load-more-stub').trigger('click');
    const options = commentsQuery.fetchMore.mock.calls[0][0];
    await wrapper.setProps({ channelUniqueName: 'dogs' });
    const previous = {
      getEventComments: makeEventSection('e1', [makeEventRoot('one')]),
    };
    expect(
      options.updateQuery(previous, {
        fetchMoreResult: {
          getEventComments: makeEventSection('e1', [makeEventRoot('two')]),
        },
      })
    ).toBe(previous);
  });

  it('does not merge a late page after changing the sort', async () => {
    const { wrapper, commentsQuery } = setup();
    await wrapper.find('.load-more-stub').trigger('click');
    const options = commentsQuery.fetchMore.mock.calls[0][0];
    h.route.query.sort = 'new';
    await wrapper.vm.$nextTick();
    const previous = { getEventComments: makeEventSection() };
    expect(
      options.updateQuery(previous, {
        fetchMoreResult: {
          getEventComments: makeEventSection('e1', [makeEventRoot()]),
        },
      })
    ).toBe(previous);
  });

  it.each([null, { Event: null, Comments: [] }, makeEventSection('other')])(
    'rejects missing or mismatched pagination context',
    async (section) => {
      const { wrapper, commentsQuery } = setup();
      await wrapper.find('.load-more-stub').trigger('click');
      const previous = { getEventComments: makeEventSection() };
      expect(
        commentsQuery.fetchMore.mock.calls[0][0].updateQuery(previous, {
          fetchMoreResult: { getEventComments: section },
        })
      ).toBe(previous);
    }
  );

  it('deduplicates overlapping repeated pages and ignores null rows', async () => {
    const { wrapper, commentsQuery } = setup();
    await wrapper.find('.load-more-stub').trigger('click');
    const options = commentsQuery.fetchMore.mock.calls[0][0];
    const previous = {
      getEventComments: makeEventSection('e1', [makeEventRoot('one')]),
    };
    const page = {
      getEventComments: {
        ...makeEventSection('e1', [makeEventRoot('one'), makeEventRoot('two')]),
        Comments: [makeEventRoot('one'), null, makeEventRoot('two')],
      },
    };
    const first = options.updateQuery(previous, { fetchMoreResult: page });
    expect(
      options
        .updateQuery(first, { fetchMoreResult: page })
        .getEventComments.Comments.map((item: { id: string }) => item.id)
    ).toEqual(['one', 'two']);
  });

  it('keeps archived state isolated to the selected forum', async () => {
    const { wrapper } = setup({
      eventChannels: [{ ...eventChannel, archived: true }],
    });
    await wrapper.setProps({ channelUniqueName: 'dogs' });
    expect(wrapper.find('.archived-banner-stub').exists()).toBe(false);
  });

  it('does not emit an author from a stale event response', async () => {
    const { wrapper, eventQuery } = setup();
    await wrapper.setProps({ eventId: 'e2' });
    eventQuery.onResult.mock.calls[0][0]({
      data: {
        events: [
          makeEvent({
            Poster: {
              username: 'alice',
              createdAt: '',
              commentKarma: null,
              discussionKarma: null,
            },
          }),
        ],
      },
    });
    expect(wrapper.emitted('fetchedOriginalPosterUsername')).toBeUndefined();
  });
});
