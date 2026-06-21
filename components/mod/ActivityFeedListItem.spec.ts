import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ActivityFeedListItem from './ActivityFeedListItem.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      forumId: 'cats',
      commentId: '',
    },
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
  }),
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useModProfileName: () => ref('mod-alice'),
    useUsername: () => ref('alice'),
    setModProfileName: vi.fn(),
    setUsername: vi.fn(),
  };
});

vi.mock('@/composables/useForumRoleMembership', () => ({
  useForumRoleMembership: () => ({
    forumAdminUsernames: ref([]),
    forumModUsernames: ref([]),
    forumModProfileNames: ref([]),
  }),
}));

describe('ActivityFeedListItem', () => {
  const mountWrapper = () =>
    mount(ActivityFeedListItem, {
      props: {
        issue: {
          id: 'issue-1',
          relatedModProfileName: 'mod-bob',
        },
        activityItem: {
          id: 'activity-1',
          actionType: 'comment',
          actionDescription: 'commented on the issue',
          createdAt: '2024-01-01T00:00:00.000Z',
          ModerationProfile: { displayName: 'mod-bob' },
          Comment: {
            id: 'comment-1',
            text: 'Please review this moderation action.',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            CommentAuthor: {
              displayName: 'mod-bob',
            },
          },
        },
      },
      global: {
        stubs: {
          MarkdownPreview: true,
          TextEditor: true,
          ErrorBanner: true,
          RevisionDiffInline: true,
          AvatarComponent: true,
          NotificationComponent: {
            template: '<div data-testid="reported-notification" />',
            props: ['show', 'title'],
          },
          BrokenRulesModal: {
            template: '<div data-testid="report-modal" />',
            props: ['open', 'commentId', 'comment'],
          },
          SuspendModButton: {
            template: '<div data-testid="suspend-mod-button" />',
            props: ['issue', 'disabled'],
          },
          GenericButton: {
            template:
              '<button :data-testid="text" @click="$emit(\'click\')">{{ text }}</button>',
            props: ['text'],
          },
          SaveButton: true,
          'nuxt-link': true,
        },
      },
    });

  it('shows a report action in the context menu for mod-authored activity feed comments', () => {
    const wrapper = mountWrapper();

    expect(wrapper.find('[data-testid="-item-Report Mod Comment"]').exists()).toBe(true);
  });

  it('opens the report modal when the report action is clicked', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="-item-Report Mod Comment"]').trigger('click');

    expect(wrapper.find('[data-testid="report-modal"]').exists()).toBe(true);
  });

  it('shows a suspend action in the context menu when the issue targets a mod profile', () => {
    const wrapper = mountWrapper();

    expect(wrapper.find('[data-testid="-item-Suspend Mod"]').exists()).toBe(true);
  });

  it('has a hidden suspend mod button that can be triggered from the menu', () => {
    const wrapper = mountWrapper();

    // The SuspendModButton exists but is conditionally rendered when triggered from menu
    expect(wrapper.find('[data-testid="suspend-mod-button"]').exists()).toBe(true);
  });
});
