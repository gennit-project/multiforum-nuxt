import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick } from 'vue';
import IssueDetail from './IssueDetail.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

const routerReplace = vi.fn();
const refetchIssue = vi.fn();
const subscribeMutate = vi.fn();
const unsubscribeMutate = vi.fn();
const queryError = ref<Error | null>(null);
const queryLoading = ref(false);
const hasMoreActivityFeed = ref(false);
const loadMoreActivityFeed = vi.fn();
const deleteReasonError = ref('');

const buildIssueResult = () => ({
  issues: [
    {
      __typename: 'Issue',
      id: 'issue-1',
      issueNumber: 6,
      title: 'Reported event',
      body: '',
      channelUniqueName: 'toDelete',
      isOpen: true,
      locked: false,
      lockReason: '',
      relatedDiscussionId: '',
      relatedEventId: '',
      relatedCommentId: '',
      relatedChannelUniqueName: '',
      flaggedServerRuleViolation: false,
      SubscribedToNotifications: [],
      ActivityFeed: [],
      ActivityFeedAggregate: { count: 0 },
      Author: {
        __typename: 'User',
        username: 'reporter',
      },
    },
  ],
});

const issueResult = ref(buildIssueResult());

// The auto-unsubscribe composable is exercised by its own spec and an e2e
// test; here we stub it so mounting does not pull in the Pinia toast store.
vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {
      forumId: 'toDelete',
      issueNumber: '6',
    },
    query: {
      subscribeCta: '1',
    },
  }),
  useRouter: () => ({
    replace: routerReplace,
  }),
}));

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return {
    useUsername: () => ref('alice'),
    useModProfileName: () => ref('mod-alice'),
    useIsAuthenticated: () => ref(true),
    setUsername: vi.fn(),
    setModProfileName: vi.fn(),
    setIsAuthenticated: vi.fn(),
  };
});

vi.mock('@/utils/permissionUtils', () => ({
  getAllPermissions: () => ({
    isSuspendedMod: false,
  }),
}));

vi.mock('@/utils/originalPoster', () => ({
  isCurrentUserOriginalPoster: () => false,
  getIssueActionVisibility: () => ({
    canTakeActionOnUser: true,
    canTakeActionOnMod: true,
  }),
  getOriginalPoster: () => ({
    username: '',
    modProfileName: '',
  }),
}));

vi.mock('@/composables/useIssueCloseReopen', () => ({
  useIssueCloseReopen: () => ({
    closeIssue: vi.fn(),
    closeIssueLoading: ref(false),
    reopenIssue: vi.fn(),
    reopenIssueLoading: ref(false),
  }),
}));

vi.mock('@/composables/useIssueActivityFeed', () => ({
  useIssueActivityFeed: () => ({
    addIssueActivityFeedItem: vi.fn(),
    addIssueActivityFeedItemWithCommentAsMod: vi.fn(),
    addIssueActivityFeedItemWithCommentAsModLoading: ref(false),
    addIssueActivityFeedItemWithCommentAsModError: ref(null),
    addIssueActivityFeedItemWithCommentAsUser: vi.fn(),
    addIssueActivityFeedItemWithCommentAsUserLoading: ref(false),
    addIssueActivityFeedItemWithCommentAsUserError: ref(null),
    activityFeedItems: ref([]),
    hasMoreActivityFeed,
    loadMoreActivityFeed,
    resetActivityFeed: vi.fn(),
  }),
}));

vi.mock('@/composables/useIssueLock', () => ({
  useIssueLock: () => ({
    lockReasonInput: ref(''),
    showLockDialog: ref(false),
    lockIssueLoading: ref(false),
    lockIssueError: ref(null),
    unlockIssueLoading: ref(false),
    unlockIssueError: ref(null),
    handleLockIssue: vi.fn(),
    handleUnlockIssue: vi.fn(),
    openLockDialog: vi.fn(),
    closeLockDialog: vi.fn(),
  }),
}));

vi.mock('@/composables/useIssueBodyEdit', () => ({
  useIssueBodyEdit: () => ({
    isEditingIssueBody: ref(false),
    editedIssueBody: ref(''),
    updateIssueBodyLoading: ref(false),
    updateIssueBodyError: ref(null),
    issueBodyHasChanges: ref(false),
    startIssueBodyEdit: vi.fn(),
    cancelIssueBodyEdit: vi.fn(),
    saveIssueBody: vi.fn(),
  }),
}));

vi.mock('@/composables/useIssueModerationActions', () => ({
  useIssueModerationActions: () => ({
    createFormValues: ref({ text: '' }),
    deleteReasonError,
    updateComment: vi.fn(),
    handleCreateComment: vi.fn(),
    toggleCloseOpenIssue: vi.fn(),
    handleDeleteRelatedContent: vi.fn(),
  }),
}));

const mockedPermissionFlags = {
  isSuspendedMod: false,
  canEditComments: false,
  canEditDiscussions: false,
  canEditEvents: false,
};

vi.mock('@/composables/useResolvedModPermissions', () => ({
  useResolvedModPermissions: () => ({
    userPermissions: ref(mockedPermissionFlags),
  }),
}));

const GenericButtonStub = defineComponent({
  props: ['text', 'testId'],
  emits: ['click'],
  setup(props, { emit, slots }) {
    return () =>
      h(
        'button',
        {
          'data-testid': props.testId || props.text,
          onClick: () => emit('click'),
        },
        slots.default ? slots.default() : props.text
      );
  },
});

const PrimaryButtonStub = defineComponent({
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

const NotificationStub = defineComponent({
  props: ['title'],
  setup(props) {
    return () => h('div', { 'data-testid': 'notification-title' }, props.title);
  },
});

const PassThroughStub = defineComponent({
  setup(_props, { slots }) {
    return () => h('div', slots.default?.());
  },
});

describe('IssueDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPermissionFlags.isSuspendedMod = false;
    issueResult.value = buildIssueResult();
    refetchIssue.mockResolvedValue(undefined);
    queryError.value = null;
    queryLoading.value = false;
    hasMoreActivityFeed.value = false;
    deleteReasonError.value = '';

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_document, _variables, _options) => ({
        result: issueResult,
        error: queryError,
        loading: queryLoading,
        refetch: refetchIssue,
        fetchMore: vi.fn(),
        onResult: vi.fn(),
      })
    );

    let mutationCallIndex = 0;
    (useMutation as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      mutationCallIndex += 1;
      if (mutationCallIndex === 1) {
        return { mutate: subscribeMutate, loading: ref(false) };
      }
      if (mutationCallIndex === 2) {
        return { mutate: unsubscribeMutate, loading: ref(false) };
      }
      return { mutate: vi.fn(), loading: ref(false) };
    });
  });

  const buildWrapper = () =>
    mount(IssueDetail, {
      global: {
        stubs: {
          ErrorBanner: {
            props: ['text'],
            template: '<div class="error-banner">{{ text }}</div>',
          },
          PageNotFound: {
            template: '<div data-testid="page-not-found">not found</div>',
          },
          ModerationWizard: true,
          OriginalPosterActions: true,
          ActivityFeed: true,
          IssueLockedBanner: {
            props: ['lockReason'],
            template: '<div data-testid="locked-banner">{{ lockReason }}</div>',
          },
          IssueLockDialog: true,
          IssueCommentForm: true,
          IssueBodyEditor: true,
          IssueRelatedContent: true,
          IssueRelatedChannel: {
            props: ['relatedChannelUniqueName'],
            template:
              '<div data-testid="related-channel">{{ relatedChannelUniqueName }}</div>',
          },
          TagComponent: {
            props: ['tag'],
            template: '<span class="tag-chip">{{ tag }}</span>',
          },
          NotificationComponent: NotificationStub,
          PrimaryButton: PrimaryButtonStub,
          GenericButton: GenericButtonStub,
          'v-row': PassThroughStub,
          'v-col': PassThroughStub,
        },
      },
    });

  it('subscribes from the issue CTA and clears the route query', async () => {
    const wrapper = buildWrapper();

    await wrapper.get('[data-testid="toggle-issue-subscription"]').trigger('click');

    expect(subscribeMutate).toHaveBeenCalledWith({ issueId: 'issue-1' });
    expect(routerReplace).toHaveBeenCalledWith({ query: {} });
    expect(refetchIssue).toHaveBeenCalled();
    await nextTick();
    expect(wrapper.get('[data-testid="notification-title"]').text()).toBe(
      'Subscribed to issue updates'
    );
  });

  it('dismisses the issue subscribe CTA without subscribing', async () => {
    const wrapper = buildWrapper();

    expect(wrapper.text()).toContain('Subscribe to updates on this issue?');

    await wrapper.get('[data-testid="Not now"]').trigger('click');
    await nextTick();

    expect(subscribeMutate).not.toHaveBeenCalled();
    expect(routerReplace).toHaveBeenCalledWith({ query: {} });
    expect(wrapper.text()).not.toContain('Subscribe to updates on this issue?');
  });

  it('shows the moderator-account suspension banner when the current mod is suspended', () => {
    mockedPermissionFlags.isSuspendedMod = true;
    const wrapper = buildWrapper();

    expect(wrapper.text()).toContain(
      'Your moderator account is suspended. You can still use your user account where normal user permissions allow it, but moderation actions remain disabled until the suspension is reversed or expires.'
    );
  });

  it('shows the issue context channel tags', () => {
    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="issue-detail-channel-tags"]').text()).toContain(
      'toDelete'
    );
  });

  it('shows page not found when no issue is returned', () => {
    issueResult.value = { issues: [] };
    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="page-not-found"]').text()).toContain('not found');
  });

  it('falls back to page not found when the issue query errors', () => {
    queryError.value = new Error('Issue failed');
    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="page-not-found"]').text()).toContain('not found');
  });

  it('shows the lock banner when the issue is locked', () => {
    issueResult.value.issues[0].locked = true;
    issueResult.value.issues[0].lockReason = 'Escalated';
    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="locked-banner"]').text()).toContain('Escalated');
  });

  it('shows the related channel banner when present', () => {
    issueResult.value.issues[0].relatedChannelUniqueName = 'announcements';
    const wrapper = buildWrapper();

    expect(wrapper.get('[data-testid="related-channel"]').text()).toContain(
      'announcements'
    );
  });

  it('loads older posts when more activity feed items are available', async () => {
    hasMoreActivityFeed.value = true;
    const wrapper = buildWrapper();

    await wrapper.get('button[type="button"]').trigger('click');

    expect(loadMoreActivityFeed).toHaveBeenCalled();
  });

  it('shows a delete reason error banner', () => {
    deleteReasonError.value = 'Cannot delete related content';
    const wrapper = buildWrapper();

    expect(wrapper.text()).toContain('Cannot delete related content');
  });
});
