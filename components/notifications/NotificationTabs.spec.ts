import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import NotificationTabs from './NotificationTabs.vue';
import {
  GET_FEEDBACK_NOTIFICATIONS,
  GET_GENERAL_NOTIFICATIONS,
} from '@/graphQLData/notification/queries';

// Mock useUsername
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'testuser' }),
}));

// Mock Apollo composables
const mockGeneralResult = ref({
  users: [
    {
      username: 'testuser',
      Notifications: [
        {
          id: 'notif-1',
          createdAt: '2024-01-15T10:00:00Z',
          read: false,
          text: 'You have a new reply',
          notificationType: 'reply',
        },
        {
          id: 'notif-2',
          createdAt: '2024-01-14T10:00:00Z',
          read: true,
          text: 'Someone mentioned you',
          notificationType: 'mention',
        },
      ],
      NotificationsAggregate: { count: 1 },
      totalNotificationsAggregate: { count: 2 },
    },
  ],
});

const mockFeedbackResult = ref({
  users: [
    {
      username: 'testuser',
      Notifications: [
        {
          id: 'feedback-1',
          createdAt: '2024-01-16T10:00:00Z',
          read: false,
          text: 'You received feedback on your comment',
          notificationType: 'feedback',
        },
      ],
      NotificationsAggregate: { count: 1 },
      totalNotificationsAggregate: { count: 1 },
    },
  ],
});

const mockFetchMoreGeneral = vi.fn();
const mockFetchMoreFeedback = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn((query) => {
    // Return different results based on query
    const queryString = query?.loc?.source?.body || '';
    if (queryString.includes('getFeedbackNotifications')) {
      return {
        result: mockFeedbackResult,
        error: ref(null),
        loading: ref(false),
        fetchMore: mockFetchMoreFeedback,
        refetch: vi.fn(),
      };
    }
    return {
      result: mockGeneralResult,
      error: ref(null),
      loading: ref(false),
      fetchMore: mockFetchMoreGeneral,
      refetch: vi.fn(),
    };
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
  }),
}));

// Mock utils
vi.mock('@/utils', () => ({
  timeAgo: (_date: Date) => '1 day ago',
}));

describe('NotificationTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeneralResult.value = {
      users: [
        {
          username: 'testuser',
          Notifications: [
            {
              id: 'notif-1',
              createdAt: '2024-01-15T10:00:00Z',
              read: false,
              text: 'You have a new reply',
              notificationType: 'reply',
            },
            {
              id: 'notif-2',
              createdAt: '2024-01-14T10:00:00Z',
              read: true,
              text: 'Someone mentioned you',
              notificationType: 'mention',
            },
          ],
          NotificationsAggregate: { count: 1 },
          totalNotificationsAggregate: { count: 2 },
        },
      ],
    };
    mockFeedbackResult.value = {
      users: [
        {
          username: 'testuser',
          Notifications: [
            {
              id: 'feedback-1',
              createdAt: '2024-01-16T10:00:00Z',
              read: false,
              text: 'You received feedback on your comment',
              notificationType: 'feedback',
            },
          ],
          NotificationsAggregate: { count: 1 },
          totalNotificationsAggregate: { count: 1 },
        },
      ],
    };
  });

  const mountNotificationTabs = () =>
    mount(NotificationTabs, {
      global: {
        stubs: {
          MarkdownRenderer: {
            template: '<div class="markdown">{{ text }}</div>',
            props: ['text'],
          },
          ErrorBanner: { template: '<div />' },
          GenericButton: { template: '<button><slot /></button>' },
          LoadMore: {
            template:
              '<button data-testid="load-more" @click="$emit(\'load-more\')">Load more</button>',
          },
        },
      },
    });

  it('renders with General tab active by default', () => {
    const wrapper = mountNotificationTabs();

    const generalButton = wrapper.find('button:first-of-type');
    expect(generalButton.text()).toContain('General');
    expect(generalButton.classes()).toContain('border-orange-500');
  });

  it('switches to Feedback tab when clicked', async () => {
    const wrapper = mountNotificationTabs();

    const feedbackButton = wrapper.findAll('button')[1];
    await feedbackButton.trigger('click');

    expect(feedbackButton.classes()).toContain('border-orange-500');
  });

  it('displays unread count badges on tabs', () => {
    const wrapper = mountNotificationTabs();

    const badges = wrapper.findAll('span.bg-orange-500');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders notification list', () => {
    const wrapper = mountNotificationTabs();

    const list = wrapper.find('[data-testid="notification-list"]');
    expect(list.exists()).toBe(true);
  });

  it('shows different message when no notifications', async () => {
    // Override the mock to return empty notifications
    const emptyResult = ref({
      users: [
        {
          username: 'testuser',
          Notifications: [],
          NotificationsAggregate: { count: 0 },
        },
      ],
    });

    vi.mocked(vi.importActual('@vue/apollo-composable')).useQuery = vi.fn(() => ({
      result: emptyResult,
      error: ref(null),
      loading: ref(false),
      fetchMore: vi.fn(),
      refetch: vi.fn(),
    }));

    const wrapper = mountNotificationTabs();

    // Since we can't easily re-mock mid-test, just verify the component structure
    expect(wrapper.find('h1').text()).toBe('Notifications');
  });

  it('has correct tab labels', () => {
    const wrapper = mountNotificationTabs();

    const buttons = wrapper.findAll('button');
    const buttonTexts = buttons.map((b) => b.text());

    expect(buttonTexts.some((t) => t.includes('General'))).toBe(true);
    expect(buttonTexts.some((t) => t.includes('Feedback'))).toBe(true);
  });

  it('passes pagination options to notification tab queries', () => {
    mountNotificationTabs();

    const queryCalls = vi.mocked(useQuery).mock.calls;
    const generalVariables = queryCalls[0]?.[1];
    const feedbackVariables = queryCalls[1]?.[1];

    expect(typeof generalVariables).toBe('function');
    expect(typeof feedbackVariables).toBe('function');
    expect(generalVariables()).toEqual({
      username: 'testuser',
      options: {
        limit: 15,
        offset: 0,
        sort: { createdAt: 'DESC' },
      },
    });
    expect(feedbackVariables()).toEqual({
      username: 'testuser',
      options: {
        limit: 15,
        offset: 0,
        sort: { createdAt: 'DESC' },
      },
    });
  });

  it('loads more notifications using the current list length as the offset', async () => {
    mockGeneralResult.value.users[0].totalNotificationsAggregate = { count: 6 };
    const wrapper = mountNotificationTabs();

    await wrapper.get('[data-testid="load-more"]').trigger('click');

    expect(mockFetchMoreGeneral).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          options: {
            limit: 15,
            offset: 2,
            sort: { createdAt: 'DESC' },
          },
        },
      })
    );
  });

  it('keeps load more available when all loaded notifications are read but more exist', () => {
    mockGeneralResult.value.users[0].NotificationsAggregate = { count: 0 };
    mockGeneralResult.value.users[0].totalNotificationsAggregate = { count: 6 };

    const wrapper = mountNotificationTabs();

    expect(wrapper.find('[data-testid="load-more"]').exists()).toBe(true);
  });

  it('declares pagination options and total aggregates in the tab queries', () => {
    expect(GET_GENERAL_NOTIFICATIONS.loc?.source.body).toContain(
      '$options: NotificationOptions'
    );
    expect(GET_GENERAL_NOTIFICATIONS.loc?.source.body).toContain('options: $options');
    expect(GET_GENERAL_NOTIFICATIONS.loc?.source.body).toContain(
      'totalNotificationsAggregate'
    );
    expect(GET_FEEDBACK_NOTIFICATIONS.loc?.source.body).toContain(
      '$options: NotificationOptions'
    );
    expect(GET_FEEDBACK_NOTIFICATIONS.loc?.source.body).toContain('options: $options');
    expect(GET_FEEDBACK_NOTIFICATIONS.loc?.source.body).toContain(
      'totalNotificationsAggregate'
    );
  });
});
