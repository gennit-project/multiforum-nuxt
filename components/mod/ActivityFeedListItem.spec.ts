import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick } from 'vue';
import ActivityFeedListItem from './ActivityFeedListItem.vue';

const routerState = {
  commentId: '',
};

const authState = {
  username: 'alice',
  modProfileName: 'mod-alice',
};

const roleState = {
  forumAdminUsernames: [] as string[],
  forumModUsernames: [] as string[],
  forumModProfileNames: [] as string[],
  serverAdminUsernames: [] as string[],
  serverModUsernames: [] as string[],
  serverModProfileNames: [] as string[],
};

const reportState = {
  showReportModal: ref(false),
  showSuccessfullyReported: ref(false),
};

const updateCommentMutate = vi.fn().mockResolvedValue(undefined);
const updateCommentOnDone = vi.fn();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      forumId: 'cats',
      commentId: routerState.commentId,
    },
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: updateCommentMutate,
    loading: ref(false),
    error: ref(null),
    onDone: updateCommentOnDone,
  }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ref(authState.modProfileName),
  useUsername: () => ref(authState.username),
  setModProfileName: vi.fn(),
  setUsername: vi.fn(),
}));

vi.mock('@/composables/useModerationOutcomeUI', () => ({
  useModerationOutcomeUI: () => ({
    showReportModal: reportState.showReportModal,
    showSuccessfullyReported: reportState.showSuccessfullyReported,
    openReportModal: () => {
      reportState.showReportModal.value = true;
    },
    closeReportModal: () => {
      reportState.showReportModal.value = false;
    },
    handleReportedSuccessfully: () => {
      reportState.showReportModal.value = false;
      reportState.showSuccessfullyReported.value = true;
    },
    dismissReportedNotification: () => {
      reportState.showSuccessfullyReported.value = false;
    },
  }),
}));

vi.mock('@/composables/useForumRoleMembership', () => ({
  provideForumRoleMembership: vi.fn(),
  useForumRoleMembership: () => ({
    forumAdminUsernames: ref(roleState.forumAdminUsernames),
    forumModUsernames: ref(roleState.forumModUsernames),
    forumModProfileNames: ref(roleState.forumModProfileNames),
  }),
}));

vi.mock('@/composables/useServerRoleMembership', () => ({
  useServerRoleMembership: () => ({
    serverAdminUsernames: ref(roleState.serverAdminUsernames),
    serverModUsernames: ref(roleState.serverModUsernames),
    serverModProfileNames: ref(roleState.serverModProfileNames),
  }),
}));

vi.mock('@/composables/useIssueSubscription', () => ({
  useIssueSubscription: () => ({
    isIssueSubscribed: ref(false),
    showSubscribeCta: ref(false),
    showIssueSubscriptionNotification: ref(false),
    issueSubscriptionNotificationTitle: ref(''),
    subscribeToIssueLoading: ref(false),
    unsubscribeFromIssueLoading: ref(false),
    toggleIssueSubscription: vi.fn(),
    dismissSubscribeCta: vi.fn(),
  }),
}));

const GenericButtonStub = defineComponent({
  props: ['text'],
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-testid': props.text,
          onClick: () => emit('click'),
        },
        props.text
      );
  },
});

const SaveButtonStub = defineComponent({
  props: ['label'],
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-testid': props.label,
          onClick: () => emit('click'),
        },
        props.label
      );
  },
});

const MenuButtonStub = defineComponent({
  props: ['items', 'ariaLabel'],
  emits: ['handle-edit', 'handle-report', 'handle-suspend-mod'],
  setup(props, { emit, slots }) {
    return () =>
      h('div', [
        h(
          'button',
          { 'data-testid': props.ariaLabel || 'menu-trigger' },
          slots.default?.()
        ),
        ...(props.items || []).map((item: { label: string; event: string }) =>
          h(
            'button',
            {
              'data-testid': item.label,
              onClick: () => emit(item.event as 'handle-edit'),
            },
            item.label
          )
        ),
      ]);
  },
});

const TextEditorStub = defineComponent({
  props: ['initialValue', 'placeholder'],
  emits: ['update'],
  setup(props, { emit }) {
    return () =>
      h('textarea', {
        'data-testid': 'edit-comment',
        placeholder: props.placeholder,
        value: props.initialValue,
        onInput: (event: Event) =>
          emit('update', (event.target as HTMLTextAreaElement).value),
      });
  },
});

const NotificationStub = defineComponent({
  props: ['show', 'title'],
  setup(props) {
    return () =>
      props.show ? h('div', { 'data-testid': 'notification-title' }, props.title) : null;
  },
});

const makeActivityItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'activity-1',
  actionType: 'comment',
  actionDescription: 'commented on the issue',
  createdAt: '2024-01-01T00:00:00.000Z',
  ModerationProfile: { displayName: 'mod-bob' },
  User: { username: 'alice' },
  Comment: {
    id: 'comment-1',
    text: 'Please review this moderation action.',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    CommentAuthor: {
      displayName: 'mod-bob',
    },
  },
  ...overrides,
});

const mountWrapper = (overrides: Record<string, unknown> = {}) =>
  mount(ActivityFeedListItem, {
    props: {
      issue: {
        id: 'issue-1',
        relatedModProfileName: 'mod-bob',
      },
      activityItem: makeActivityItem(),
      ...overrides,
    },
    global: {
      stubs: {
        MarkdownPreview: {
          name: 'MarkdownPreview',
          props: ['text'],
          template: '<div data-testid="markdown-preview">{{ text }}</div>',
        },
        TextEditor: TextEditorStub,
        ErrorBanner: true,
        RevisionDiffInline: {
          name: 'RevisionDiffInline',
          props: ['oldVersion', 'newVersion'],
          template: '<div data-testid="revision-diff" />',
        },
        AvatarComponent: {
          name: 'AvatarComponent',
          props: ['text'],
          template: '<span data-testid="avatar">{{ text }}</span>',
        },
        NotificationComponent: NotificationStub,
        BrokenRulesModal: {
          name: 'BrokenRulesModal',
          props: ['open', 'commentId', 'comment'],
          template: '<div data-testid="report-modal" />',
        },
        SuspendModButton: {
          name: 'SuspendModButton',
          props: ['issue', 'disabled', 'autoOpen'],
          template: '<div data-testid="suspend-mod-button" />',
        },
        GenericButton: GenericButtonStub,
        SaveButton: SaveButtonStub,
        MenuButton: MenuButtonStub,
        'nuxt-link': {
          name: 'NuxtLink',
          props: ['to'],
          template: '<a><slot /></a>',
        },
        EllipsisHorizontal: {
          name: 'EllipsisHorizontal',
          template: '<span />',
        },
      },
    },
  });

describe('ActivityFeedListItem', () => {
  beforeEach(() => {
    routerState.commentId = '';
    authState.username = 'alice';
    authState.modProfileName = 'mod-alice';
    roleState.forumAdminUsernames = [];
    roleState.forumModUsernames = [];
    roleState.forumModProfileNames = [];
    roleState.serverAdminUsernames = [];
    roleState.serverModUsernames = [];
    roleState.serverModProfileNames = [];
    reportState.showReportModal.value = false;
    reportState.showSuccessfullyReported.value = false;
    updateCommentMutate.mockClear();
    updateCommentOnDone.mockClear();
  });

  it('shows a report action in the context menu for reportable mod comments', () => {
    const wrapper = mountWrapper();

    expect(wrapper.find('[data-testid="Report Mod Comment"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="Suspend Mod"]').exists()).toBe(true);
  });

  it('opens the report modal and suspend flow from the menu', async () => {
    const wrapper = mountWrapper();

    await wrapper.get('[data-testid="Report Mod Comment"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-testid="report-modal"]').exists()).toBe(true);

    await wrapper.get('[data-testid="Suspend Mod"]').trigger('click');
    await nextTick();

    expect(wrapper.find('[data-testid="suspend-mod-button"]').exists()).toBe(true);
  });

  it('opens edit mode for the comment author and saves a change', async () => {
    authState.username = 'alice';
    const wrapper = mountWrapper({
      activityItem: makeActivityItem({
        Comment: {
          id: 'comment-1',
          text: 'Original text',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          CommentAuthor: { username: 'alice' },
        },
      }),
    });

    await wrapper.get('[data-testid="Edit"]').trigger('click');
    await nextTick();

    await wrapper.get('[data-testid="edit-comment"]').setValue('Updated text');
    await wrapper.get('[data-testid="Save"]').trigger('click');

    expect(updateCommentMutate).toHaveBeenCalled();
  });

  it('renders comment revision history and permalink styling for edited comments', () => {
    routerState.commentId = 'comment-1';
    roleState.serverAdminUsernames = ['alice'];

    const wrapper = mountWrapper({
      activityItem: makeActivityItem({
        actionType: 'edit',
        actionDescription: 'edited the comment',
        Comment: {
          id: 'comment-1',
          text: 'Current text',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          CommentAuthor: { displayName: 'mod-bob' },
          PastVersions: [
            {
              id: 'version-1',
              body: 'Previous text',
              createdAt: '2024-01-01T00:00:00.000Z',
              Author: { username: 'alice' },
            },
          ],
        },
      }),
      commentEditIndex: 0,
    });

    expect(wrapper.find('li').classes()).toContain('border-orange-500');
    expect(wrapper.find('[data-testid="revision-diff"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="markdown-preview"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Server Admin');
  });

  it('renders a dedicated label-update phrase and icon for a label_update action', () => {
    const wrapper = mountWrapper({
      activityItem: makeActivityItem({
        actionType: 'label_update',
        actionDescription: 'updated the labels on the download',
        Comment: null,
        ModerationProfile: { displayName: 'mod-bob' },
        User: null,
      }),
    });

    expect({
      phrase: wrapper.text().includes('the download labels were updated by'),
      hasIcon: wrapper.find('svg').exists(),
    }).toEqual({ phrase: true, hasIcon: true });
  });

  it('shows a suspend button when the activity actor targets the issue mod', () => {
    const wrapper = mountWrapper({
      issue: {
        id: 'issue-1',
        relatedModProfileName: 'mod-bob',
      },
      activityItem: makeActivityItem({
        Comment: null,
        ModerationProfile: { displayName: 'mod-bob' },
        User: null,
      }),
    });

    expect(wrapper.find('[data-testid="suspend-mod-button"]').exists()).toBe(true);
  });
});
