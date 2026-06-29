import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import ActivityFeedListItem from './ActivityFeedListItem.vue';

const updateMutate = vi.fn().mockResolvedValue({});
let onUpdateDone: (() => void) | null = null;

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { forumId: 'cats', commentId: '' } }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: updateMutate,
    loading: ref(false),
    error: ref(null),
    onDone: (cb: () => void) => {
      onUpdateDone = cb;
    },
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref('mod-alice'),
  useUsername: () => ref('alice'),
  setModProfileName: vi.fn(),
  setUsername: vi.fn(),
}));

vi.mock('@/composables/useForumRoleMembership', () => ({
  useForumRoleMembership: () => ({
    forumAdminUsernames: ref([]),
    forumModUsernames: ref([]),
    forumModProfileNames: ref([]),
  }),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: ref([]),
    serverModUsernames: ref([]),
    serverModProfileNames: ref([]),
  }),
}));

const stubs = {
  MarkdownPreview: { props: ['text'], template: '<div class="md">{{ text }}</div>' },
  TextEditor: {
    props: ['initialValue'],
    template: '<textarea class="editor" @input="$emit(\'update\', $event.target.value)" />',
  },
  ErrorBanner: true,
  RevisionDiffInline: true,
  AvatarComponent: true,
  UsernameWithTooltip: true,
  NotificationComponent: true,
  BrokenRulesModal: true,
  SuspendModButton: true,
  EllipsisHorizontal: { template: '<i />' },
  GenericButton: {
    props: ['text'],
    template: '<button :data-testid="text" @click="$emit(\'click\')">{{ text }}</button>',
  },
  SaveButton: {
    props: ['label', 'disabled', 'loading'],
    template: '<button data-testid="save" @click="$emit(\'click\')" />',
  },
  MenuButton: {
    props: ['items'],
    template: '<button class="menu-btn"><slot /></button>',
  },
  'nuxt-link': true,
  NuxtLink: { template: '<a><slot /></a>' },
};

const baseActivity = (overrides: Record<string, unknown> = {}) => ({
  id: 'activity-1',
  actionType: 'comment',
  actionDescription: 'commented on the issue',
  createdAt: '2024-01-01T00:00:00.000Z',
  ModerationProfile: { displayName: 'mod-bob' },
  Comment: {
    id: 'comment-1',
    text: 'Original comment body.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    CommentAuthor: { displayName: 'mod-bob' },
  },
  ...overrides,
});

const buildWrapper = (
  activityOverrides: Record<string, unknown> = {},
  props: Record<string, unknown> = {}
) =>
  mount(ActivityFeedListItem, {
    props: {
      issue: { id: 'issue-1', relatedModProfileName: 'mod-bob' },
      activityItem: baseActivity(activityOverrides),
      ...props,
    },
    global: { stubs },
  });

beforeEach(() => {
  updateMutate.mockClear().mockResolvedValue({});
  onUpdateDone = null;
});

describe('ActivityFeedListItem — action phrase', () => {
  it.each([
    ['reopen', 'commented on the issue', 'was reopened by'],
    ['close', 'commented on the issue', 'was closed by'],
    ['edit', 'edited the comment', 'comment was edited by'],
    ['delete', 'deleted the discussion', 'discussion was deleted by'],
    ['remove', 'removed the event', 'event was removed by'],
    ['archive', 'archived the discussion', 'discussion was archived by'],
    ['un-archive', 'unarchived the download', 'download was unarchived by'],
    ['report', 'reported the comment', 'comment was reported by'],
    ['comment', 'commented on the issue', 'a comment was added by'],
    ['suspension', 'suspended the user', 'user was suspended by'],
    ['unsuspend', 'unsuspended the user', 'user was unsuspended by'],
  ])(
    'renders the passive phrase for the %s action',
    (actionType, actionDescription, phrase) => {
      const wrapper = buildWrapper({ actionType, actionDescription });

      expect(wrapper.text()).toContain(phrase);
    }
  );
});

describe('ActivityFeedListItem — comment authorship', () => {
  it('treats a user-authored comment by the current user as own', () => {
    const wrapper = buildWrapper(
      { Comment: { id: 'c1', text: 'mine', CommentAuthor: { username: 'alice' } } },
      { showCommentMenu: true }
    );

    expect(wrapper.find('.menu-btn').exists()).toBe(true);
  });
});

describe('ActivityFeedListItem — comment edit flow', () => {
  const mountOwn = () =>
    buildWrapper(
      {
        Comment: {
          id: 'c1',
          text: 'Original comment body.',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          CommentAuthor: { username: 'alice' },
        },
      },
      { showCommentMenu: true }
    );

  it('enters edit mode from the comment menu', async () => {
    const wrapper = mountOwn();
    await wrapper.findComponent('.menu-btn').vm.$emit('handle-edit');

    expect(wrapper.find('.editor').exists()).toBe(true);
  });

  it('saves an edited comment when the text changed', async () => {
    const wrapper = mountOwn();
    await wrapper.findComponent('.menu-btn').vm.$emit('handle-edit');
    await wrapper.find('.editor').setValue('A changed comment body');
    await wrapper.find('[data-testid="save"]').trigger('click');

    expect(updateMutate).toHaveBeenCalled();
  });

  it('does not save when the comment is unchanged', async () => {
    const wrapper = mountOwn();
    await wrapper.findComponent('.menu-btn').vm.$emit('handle-edit');
    await wrapper.find('[data-testid="save"]').trigger('click');

    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('leaves edit mode after cancelling', async () => {
    const wrapper = mountOwn();
    await wrapper.findComponent('.menu-btn').vm.$emit('handle-edit');
    await wrapper.find('[data-testid="Cancel"]').trigger('click');

    expect(wrapper.find('.editor').exists()).toBe(false);
  });

  it('exits edit mode when the update completes', async () => {
    const wrapper = mountOwn();
    await wrapper.findComponent('.menu-btn').vm.$emit('handle-edit');
    await wrapper.find('.editor').setValue('A changed comment body');
    await wrapper.find('[data-testid="save"]').trigger('click');
    onUpdateDone?.();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.editor').exists()).toBe(false);
  });
});
