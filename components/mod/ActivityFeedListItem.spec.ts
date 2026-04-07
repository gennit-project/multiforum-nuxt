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

vi.mock('@/cache', () => ({
  modProfileNameVar: { value: 'mod-alice' },
  usernameVar: { value: 'alice' },
}));

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

  it('shows a report action for mod-authored activity feed comments', () => {
    const wrapper = mountWrapper();

    expect(wrapper.find('[data-testid="Report Mod Comment"]').exists()).toBe(true);
  });

  it('opens the report modal when the report action is clicked', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="Report Mod Comment"]').trigger('click');

    expect(wrapper.find('[data-testid="report-modal"]').exists()).toBe(true);
  });

  it('shows a suspend action when the issue already targets the comment author mod profile', () => {
    const wrapper = mountWrapper();

    expect(wrapper.find('[data-testid="suspend-mod-button"]').exists()).toBe(true);
  });
});
