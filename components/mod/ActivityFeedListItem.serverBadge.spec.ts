import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ActivityFeedListItem from './ActivityFeedListItem.vue';

const h = vi.hoisted(() => ({
  serverAdminUsernames: [] as string[],
  serverModProfileNames: [] as string[],
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', commentId: '' } }),
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
  const { ref: r } = await import('vue');
  return {
    useModProfileName: () => r('mod-alice'),
    useUsername: () => r('alice'),
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

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: ref(h.serverAdminUsernames),
    serverModUsernames: ref([]),
    serverModProfileNames: ref(h.serverModProfileNames),
  }),
}));

const mountItem = (activityItem: Record<string, unknown>) =>
  mount(ActivityFeedListItem, {
    props: { issue: { id: 'issue-1' }, activityItem },
    global: {
      stubs: {
        MarkdownPreview: true,
        TextEditor: true,
        ErrorBanner: true,
        RevisionDiffInline: true,
        AvatarComponent: true,
        NotificationComponent: true,
        BrokenRulesModal: true,
        SuspendModButton: true,
        GenericButton: true,
        SaveButton: true,
        // Render the slot so badge spans inside the author link are visible.
        'nuxt-link': { template: '<a><slot /></a>' },
      },
    },
  });

beforeEach(() => {
  h.serverAdminUsernames = [];
  h.serverModProfileNames = [];
});

describe('ActivityFeedListItem server role badge', () => {
  it('shows a Server Mod badge for a mod-profile actor who is a server moderator', () => {
    h.serverModProfileNames = ['mod-bob'];
    const wrapper = mountItem({
      id: 'a1',
      actionType: 'comment',
      actionDescription: 'commented on the issue',
      createdAt: '2024-01-01T00:00:00.000Z',
      ModerationProfile: { displayName: 'mod-bob' },
    });

    expect(wrapper.text()).toContain('Server Mod');
  });

  it('shows a Server Admin badge for a user actor who is a server admin', () => {
    h.serverAdminUsernames = ['admin-sam'];
    const wrapper = mountItem({
      id: 'a2',
      actionType: 'close',
      actionDescription: 'closed the issue',
      createdAt: '2024-01-01T00:00:00.000Z',
      User: { username: 'admin-sam' },
    });

    expect(wrapper.text()).toContain('Server Admin');
  });

  it('shows no server badge for an actor with no server role', () => {
    const wrapper = mountItem({
      id: 'a3',
      actionType: 'comment',
      actionDescription: 'commented on the issue',
      createdAt: '2024-01-01T00:00:00.000Z',
      ModerationProfile: { displayName: 'mod-bob' },
    });

    expect(wrapper.text()).not.toContain('Server');
  });
});
