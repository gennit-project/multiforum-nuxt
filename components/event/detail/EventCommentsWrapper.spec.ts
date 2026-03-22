import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import EventCommentsWrapper from './EventCommentsWrapper.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

const mutateSpies = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
const onDoneCallbacks: Array<(() => void) | undefined> = [];

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      eventId: 'event-1',
      forumId: 'forum-1',
    },
    query: {},
  }),
}));

vi.mock('@/cache', () => ({
  usernameVar: { value: 'alice' },
}));

vi.mock('@/components/comments/getSortFromQuery', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getSortFromQuery: () => 'new',
  };
});

const CommentSectionStub = defineComponent({
  props: ['showNuxtPage'],
  setup(props, { slots }) {
    return () =>
      h('div', { 'data-testid': 'comment-section', 'data-show-nuxt-page': String(props.showNuxtPage) }, [
        slots['subscription-button']?.(),
      ]);
  },
});

const EventNotificationsMenuStub = defineComponent({
  props: ['watchComments', 'watchUpdates', 'commentsLoading', 'updatesLoading'],
  emits: ['toggleComments', 'toggleUpdates'],
  setup(props, { emit }) {
    return () =>
      h('div', { 'data-testid': 'notifications-menu' }, [
        h('button', {
          'data-testid': 'toggle-comments',
          onClick: () => emit('toggleComments'),
        }),
        h('button', {
          'data-testid': 'toggle-updates',
          onClick: () => emit('toggleUpdates'),
        }),
        h('span', { 'data-testid': 'watch-comments' }, String(props.watchComments)),
        h('span', { 'data-testid': 'watch-updates' }, String(props.watchUpdates)),
      ]);
  },
});

const NotificationStub = defineComponent({
  props: ['show', 'title', 'detail'],
  setup(props) {
    return () =>
      h('div', { 'data-testid': 'notification', 'data-show': String(props.show) }, [
        h('span', { 'data-testid': 'notification-title' }, props.title || ''),
        h('span', { 'data-testid': 'notification-detail' }, props.detail || ''),
      ]);
  },
});

describe('EventCommentsWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onDoneCallbacks.length = 0;
    mutateSpies.forEach((spy) => spy.mockReset());

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      result: ref({
        users: [{ notifyOnReplyToCommentByDefault: true }],
      }),
    });

    (useMutation as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_document, options) => {
        const callIndex = onDoneCallbacks.length;
        return {
          mutate: mutateSpies[callIndex],
          loading: ref(false),
          onDone: (callback: () => void) => {
            onDoneCallbacks[callIndex] = callback;
          },
          options,
        };
      }
    );
  });

  const buildWrapper = (subscribedToEventUpdates: Array<{ username: string }> = []) =>
    mount(EventCommentsWrapper, {
      props: {
        event: {
          __typename: 'Event',
          id: 'event-1',
          CommentsAggregate: { count: 2 },
          SubscribedToNotifications: [],
          SubscribedToEventUpdates: subscribedToEventUpdates,
        },
        comments: [],
        loading: false,
        reachedEndOfResults: true,
        previousOffset: 0,
        originalPoster: 'cluse',
        archived: false,
        locked: false,
      },
      global: {
        stubs: {
          CommentSection: CommentSectionStub,
          EventNotificationsMenu: EventNotificationsMenuStub,
          Notification: NotificationStub,
        },
      },
    });

  it('subscribes to event updates and shows the success notification', async () => {
    const wrapper = buildWrapper();

    await wrapper.get('[data-testid="toggle-updates"]').trigger('click');

    expect(mutateSpies[2]).toHaveBeenCalledWith({ eventId: 'event-1' });

    const modify = vi.fn();
    const identify = vi.fn(() => 'Event:event-1');
    const subscribeUpdate = (useMutation as unknown as ReturnType<typeof vi.fn>).mock.calls[2]?.[1]?.update;
    subscribeUpdate(
      { modify, identify },
      {
        data: {
          subscribeToEventUpdates: {
            SubscribedToEventUpdates: [{ username: 'alice' }],
          },
        },
      }
    );

    expect(identify).toHaveBeenCalledWith({ __typename: 'Event', id: 'event-1' });
    expect(modify).toHaveBeenCalled();

    onDoneCallbacks[2]?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="notification-title"]').text()).toBe(
      'Event update notifications turned on'
    );
  });

  it('unsubscribes from event updates when already subscribed', async () => {
    const wrapper = buildWrapper([{ username: 'alice' }]);

    expect(wrapper.get('[data-testid="watch-updates"]').text()).toBe('true');

    await wrapper.get('[data-testid="toggle-updates"]').trigger('click');

    expect(mutateSpies[3]).toHaveBeenCalledWith({ eventId: 'event-1' });
  });
});
