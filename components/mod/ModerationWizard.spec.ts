import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ModerationWizard from './ModerationWizard.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: {},
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// A single mutable result object is shared by all five useQuery calls in the
// component, so tests can flip archived/suspended/download state per case.
const { mockQueryState } = vi.hoisted(() => ({
  mockQueryState: {
    value: {
      discussionChannels: [{ archived: false }],
      eventChannels: [{ archived: false }],
      comments: [{ archived: false }],
      isOriginalPosterSuspended: false,
      discussions: [{ hasDownload: false }],
    } as Record<string, unknown>,
  },
}));

const setQueryState = (patch: Record<string, unknown>) => {
  mockQueryState.value = { ...mockQueryState.value, ...patch };
};

vi.mock('@vue/apollo-composable', async () => {
  const { computed } = await import('vue');
  return {
    useQuery: () => ({
      result: computed(() => mockQueryState.value),
    }),
  };
});

vi.mock('@/composables/useAuthState', async () => {
  const { ref } = await import('vue');
  return { useModProfileName: () => ref('mod-alice'), setModProfileName: vi.fn() };
});

describe('ModerationWizard', () => {
  beforeEach(() => {
    mockQueryState.value = {
      discussionChannels: [{ archived: false }],
      eventChannels: [{ archived: false }],
      comments: [{ archived: false }],
      isOriginalPosterSuspended: false,
      discussions: [{ hasDownload: false }],
    };
  });

  const mountWrapper = (propOverrides: Record<string, unknown> = {}) =>
    mount(ModerationWizard, {
      props: {
        issue: {
          id: 'issue-1',
          isOpen: true,
        },
        commentId: 'comment-1',
        channelUniqueName: 'cats',
        contextText: 'Reported comment',
        isSuspendedMod: true,
        canEditComments: true,
        reportCount: 1,
        ...propOverrides,
      },
      global: {
        stubs: {
          RequireAuth: { template: '<div><slot name="has-auth" /></div>' },
          AdminIcon: true,
          ScalesIcon: true,
          PencilIcon: true,
          CloseIssueAction: {
            template:
              '<button data-testid="close-issue-action" :disabled="false">Close</button>',
          },
          ArchiveButton: {
            template:
              '<div data-testid="archive-button" :data-disabled="String(disabled)"></div>',
            props: ['disabled'],
          },
          SuspendUserButton: {
            template:
              '<div data-testid="suspend-user-button" :data-disabled="String(disabled)"></div>',
            props: ['disabled'],
          },
          SuspendModButton: {
            template:
              '<div data-testid="suspend-mod-button" :data-disabled="String(disabled)"></div>',
            props: ['disabled'],
          },
          EditContentModal: {
            props: ['open'],
            template:
              '<div data-testid="edit-modal" :data-open="String(open)" @click="$emit(\'saved\')" />',
          },
        },
      },
    });

  it('shows the suspended-mod message', () => {
    const wrapper = mountWrapper();

    expect(wrapper.text()).toContain(
      'Mod actions are disabled because your moderator account is suspended. This does not suspend your user account.'
    );
  });

  it('disables the archive button when the moderator is suspended', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('[data-testid="archive-button"]').attributes('data-disabled')).toBe(
      'true'
    );
  });

  it('disables the suspend-user button when the moderator is suspended', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('[data-testid="suspend-user-button"]').attributes('data-disabled')).toBe(
      'true'
    );
  });

  it('disables the edit action when the moderator is suspended', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('[data-test="edit-comment"]').attributes('disabled')).toBeDefined();
  });

  it('re-enables the archive button once the moderator is no longer suspended', () => {
    const wrapper = mountWrapper({ isSuspendedMod: false });

    expect(
      wrapper.get('[data-testid="archive-button"]').attributes('data-disabled')
    ).toBe('false');
  });

  const reportedComment = {
    commentId: 'comment-1',
    reportCount: 1,
    isSuspendedMod: false,
    canEditComments: true,
  };
  const reportedDiscussion = {
    commentId: undefined,
    discussionId: 'd1',
    reportCount: 1,
    isSuspendedMod: false,
    canEditDiscussions: true,
  };

  it('offers the edit-comment action for a reported comment', () => {
    const wrapper = mountWrapper(reportedComment);

    expect(wrapper.find('[data-test="edit-comment"]').exists()).toBe(true);
  });

  it('offers the edit-discussion action for a reported discussion', () => {
    const wrapper = mountWrapper(reportedDiscussion);

    expect(wrapper.find('[data-test="edit-discussion"]').exists()).toBe(true);
  });

  it('hides edit actions for an event', () => {
    const wrapper = mountWrapper({
      commentId: undefined,
      eventId: 'e1',
      reportCount: 1,
      isSuspendedMod: false,
      canEditEvents: true,
    });

    expect(wrapper.find('[data-test="edit-event"]').exists()).toBe(false);
  });

  it('hides edit actions when the content has not been reported', () => {
    const wrapper = mountWrapper({ ...reportedComment, reportCount: 0 });

    expect(wrapper.find('[data-test="edit-comment"]').exists()).toBe(false);
  });

  it('disables the edit action without edit permission', () => {
    const wrapper = mountWrapper({ ...reportedComment, canEditComments: false });

    expect(
      wrapper.get('[data-test="edit-comment"]').attributes('disabled')
    ).toBeDefined();
  });

  it('opens the edit modal when the edit action is clicked', async () => {
    const wrapper = mountWrapper(reportedComment);
    await wrapper.get('[data-test="edit-comment"]').trigger('click');

    expect(wrapper.get('[data-testid="edit-modal"]').attributes('data-open')).toBe(
      'true'
    );
  });

  it('re-emits archived-successfully when the edit modal saves', async () => {
    const wrapper = mountWrapper(reportedComment);
    await wrapper.get('[data-testid="edit-modal"]').trigger('click');

    expect(wrapper.emitted('archived-successfully')).toBeTruthy();
  });

  describe('content type resolution', () => {
    it('treats a discussion flagged as a download as download content', () => {
      const wrapper = mountWrapper({
        commentId: undefined,
        discussionId: 'd1',
        relatedDiscussionHasDownload: true,
        canEditDiscussions: true,
        isSuspendedMod: false,
      });
      // editModalTargetType resolves to 'download', so the modal renders with it.
      expect(wrapper.get('[data-testid="edit-modal"]').exists()).toBe(true);
    });

    it('renders the edit modal for an event when the user can edit events', () => {
      const wrapper = mountWrapper({
        commentId: undefined,
        eventId: 'e1',
        canEditEvents: true,
        isSuspendedMod: false,
      });
      expect(wrapper.get('[data-testid="edit-modal"]').exists()).toBe(true);
    });

    it('renders no edit modal for a wiki-edit issue with no content ids', () => {
      const wrapper = mountWrapper({
        commentId: undefined,
        issue: { id: 'issue-1', isOpen: true, relatedWikiPageId: 'wiki-1' },
        isSuspendedMod: false,
      });
      expect(wrapper.find('[data-testid="edit-modal"]').exists()).toBe(false);
    });
  });

  describe('archived content', () => {
    beforeEach(() => setQueryState({ comments: [{ archived: true }] }));

    it('shows the "already archived" state for archived content', () => {
      const wrapper = mountWrapper({ isSuspendedMod: false });
      expect(wrapper.text()).toContain('Archive (Already Archived)');
    });
  });

  describe('unauthenticated fallback', () => {
    it('shows the log-in prompt when RequireAuth renders its no-auth slot', () => {
      const wrapper = mount(ModerationWizard, {
        props: {
          issue: { id: 'issue-1', isOpen: true },
          commentId: 'comment-1',
          channelUniqueName: 'cats',
        },
        global: {
          stubs: {
            RequireAuth: {
              template:
                '<div><slot name="has-auth" /><slot name="does-not-have-auth" /></div>',
            },
            AdminIcon: true,
            ScalesIcon: true,
            PencilIcon: true,
            CloseIssueAction: true,
            ArchiveButton: true,
            SuspendUserButton: true,
            SuspendModButton: true,
            EditContentModal: true,
          },
        },
      });
      expect(wrapper.text()).toContain(
        'Please log in to access moderation features'
      );
    });
  });

  describe('suspended author', () => {
    beforeEach(() => setQueryState({ isOriginalPosterSuspended: true }));

    it('offers to unsuspend a suspended mod author', () => {
      const wrapper = mountWrapper({ authorType: 'mod', isSuspendedMod: false });
      expect(wrapper.get('[data-testid="suspend-mod-button"]').exists()).toBe(true);
    });

    it('offers to unsuspend a suspended user author', () => {
      const wrapper = mountWrapper({ authorType: 'user', isSuspendedMod: false });
      expect(wrapper.get('[data-testid="suspend-user-button"]').exists()).toBe(true);
    });

    it('shows the "already suspended" state in the destructive section', () => {
      const wrapper = mountWrapper({ authorType: 'user', isSuspendedMod: false });
      expect(wrapper.text()).toContain('Suspend Author (Already Suspended)');
    });
  });
});
