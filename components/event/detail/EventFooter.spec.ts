import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';
import EventFooter from './EventFooter.vue';

const serverAdminUsernames = ref<string[]>([]);

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      forumId: 'cats',
      eventId: 'event-1',
    },
  }),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: computed(() => serverAdminUsernames.value),
  }),
}));

describe('EventFooter', () => {
  beforeEach(() => {
    serverAdminUsernames.value = [];
  });

  const buildWrapper = () =>
    mount(EventFooter, {
      props: {
        eventData: {
          id: 'event-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          startTime: '2024-01-02T00:00:00Z',
          virtualEventUrl: null,
          address: null,
          Poster: {
            username: 'alice',
            displayName: 'Alice',
            profilePicURL: '',
            commentKarma: 1,
            discussionKarma: 2,
            createdAt: '2024-01-01T00:00:00Z',
            ChannelRoles: [],
          },
        },
      },
      global: {
        stubs: {
          UsernameWithTooltip: {
            props: ['isAdmin'],
            template:
              '<div data-testid="username-with-tooltip">{{ isAdmin }}</div>',
          },
        },
      },
    });

  it('passes isAdmin when poster belongs to server admin membership', () => {
    serverAdminUsernames.value = ['alice'];

    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="username-with-tooltip"]').text()).toBe(
      'true'
    );
  });

  it('does not pass isAdmin when poster is not in server admin membership', () => {
    serverAdminUsernames.value = ['bob'];

    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="username-with-tooltip"]').text()).toBe(
      'false'
    );
  });
});
