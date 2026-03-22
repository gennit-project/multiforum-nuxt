import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref, nextTick } from 'vue';
import IssueDetail from './IssueDetail.vue';
import { useMutation, useQuery } from '@vue/apollo-composable';

const routerReplace = vi.fn();
const refetchIssue = vi.fn();
const subscribeMutate = vi.fn();
const unsubscribeMutate = vi.fn();

const issueResult = ref({
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
      relatedDiscussionId: '',
      relatedEventId: '',
      relatedCommentId: '',
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

vi.mock('@/cache', () => ({
  usernameVar: { value: 'alice' },
  modProfileNameVar: { value: 'mod-alice' },
}));

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
    issueResult.value.issues[0].SubscribedToNotifications = [];
    refetchIssue.mockResolvedValue(undefined);

    (useQuery as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (_document, _variables, _options) => ({
        result: issueResult,
        error: ref(null),
        loading: ref(false),
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
          ErrorBanner: true,
          PageNotFound: true,
          ModerationWizard: true,
          OriginalPosterActions: true,
          ActivityFeed: true,
          IssueLockedBanner: true,
          IssueLockDialog: true,
          IssueCommentForm: true,
          IssueBodyEditor: true,
          IssueRelatedContent: true,
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
});
