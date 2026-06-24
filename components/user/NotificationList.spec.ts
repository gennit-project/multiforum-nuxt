import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import NotificationList from '@/components/user/NotificationList.vue';

const h = vi.hoisted(() => ({
  result: null as unknown,
  error: null as unknown,
  loading: null as unknown,
  fetchMore: vi.fn(),
  refetch: vi.fn(),
  markRead: vi.fn(),
  markError: null as unknown,
  onDone: undefined as undefined | (() => void),
  username: null as unknown,
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: h.result,
    error: h.error,
    loading: h.loading,
    fetchMore: h.fetchMore,
    refetch: h.refetch,
  }),
  useMutation: () => ({
    mutate: h.markRead,
    loading: ref(false),
    error: h.markError,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));
vi.mock('@/composables/useAuthState', () => ({ useUsername: () => h.username }));

const notification = (overrides: Record<string, unknown> = {}) => ({
  id: 'n1',
  text: 'You have a reply',
  read: false,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const userData = (notifications: unknown[], count?: number) => ({
  users: [
    {
      Notifications: notifications,
      NotificationsAggregate: { count: count ?? notifications.length },
    },
  ],
});

const mountList = () =>
  mount(NotificationList, {
    global: {
      stubs: {
        ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div class="err">{{ text }}</div>' },
        GenericButton: { name: 'GenericButton', props: ['text', 'loading'], emits: ['click'], template: '<button @click="$emit(\'click\')">{{ text }}</button>' },
        MarkdownRenderer: { name: 'MarkdownRenderer', props: ['text'], template: '<div class="md">{{ text }}</div>' },
        LoadMore: { name: 'LoadMore', props: ['loading', 'reachedEndOfResults'], emits: ['load-more'], template: '<div class="load" />' },
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.result = ref(userData([notification()]));
  h.error = ref(null);
  h.loading = ref(false);
  h.markError = ref(null);
  h.onDone = undefined;
  h.username = ref('alice');
});

describe('NotificationList states', () => {
  it('shows a loading message', () => {
    h.loading = ref(true);
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Loading');
  });

  it('shows an error banner on query error', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountList();

    expect(wrapper.find('.err').text()).toContain('boom');
  });

  it('shows the empty message when there are no notifications', () => {
    h.result = ref(userData([]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('no notifications to show');
  });
});

describe('NotificationList content', () => {
  it('renders a notification', () => {
    const wrapper = mountList();

    expect(wrapper.find('.md').text()).toBe('You have a reply');
  });

  it('shows the unread label', () => {
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Unread');
  });

  it('shows the read label for a read notification', () => {
    h.result = ref(userData([notification({ read: true })]));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('Read');
  });

  it('shows the unread aggregate count', () => {
    h.result = ref(userData([notification()], 4));
    const wrapper = mountList();

    expect(wrapper.text()).toContain('You have 4 unread notifications');
  });
});

describe('NotificationList actions', () => {
  it('marks all as read with the username', async () => {
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'GenericButton' }).vm.$emit('click');

    expect(h.markRead).toHaveBeenCalledWith({ username: 'alice' });
  });

  it('refetches when the mark-read mutation completes', () => {
    mountList();

    h.onDone?.();

    expect(h.refetch).toHaveBeenCalled();
  });

  it('shows a Load More button when more notifications exist', () => {
    h.result = ref(userData([notification()], 10));
    const wrapper = mountList();

    expect(wrapper.findComponent({ name: 'LoadMore' }).exists()).toBe(true);
  });

  it('fetches more on load-more', async () => {
    h.result = ref(userData([notification()], 10));
    const wrapper = mountList();

    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    expect(h.fetchMore).toHaveBeenCalled();
  });

  it('merges fetched pages via updateQuery', async () => {
    h.result = ref(userData([notification({ id: 'n1' })], 10));
    const wrapper = mountList();
    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    const { updateQuery } = h.fetchMore.mock.calls[0][0];
    const merged = updateQuery(userData([notification({ id: 'n1' })]), {
      fetchMoreResult: userData([notification({ id: 'n2' })]),
    });

    expect(merged.users[0].Notifications).toHaveLength(2);
  });

  it('keeps the previous result when there is no fetchMoreResult', async () => {
    h.result = ref(userData([notification({ id: 'n1' })], 10));
    const wrapper = mountList();
    await wrapper.getComponent({ name: 'LoadMore' }).vm.$emit('load-more');

    const { updateQuery } = h.fetchMore.mock.calls[0][0];
    const prev = userData([notification({ id: 'n1' })]);

    expect(updateQuery(prev, { fetchMoreResult: null })).toBe(prev);
  });

  it('shows an error banner on mark-read failure', () => {
    h.markError = ref({ message: 'mark boom' });
    const wrapper = mountList();

    expect(wrapper.text()).toContain('mark boom');
  });
});
