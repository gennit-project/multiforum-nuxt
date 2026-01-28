import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CommentSection from '@/components/comments/CommentSection.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({
    params: { forumId: 'cats' },
    query: {},
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    onDone: vi.fn(),
    error: null,
    loading: false,
  })),
}));

vi.mock('@/composables/useSuspensionNotice', () => ({
  useChannelSuspensionNotice: () => ({
    issueNumber: ref(44),
    suspendedUntil: ref('2030-01-01T00:00:00.000Z'),
    suspendedIndefinitely: ref(false),
    channelId: ref('cats'),
  }),
}));

vi.mock('@/cache', () => ({
  modProfileNameVar: {
    value: 'mod-one',
  },
}));

vi.mock('@/components/comments/getSortFromQuery', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getSortFromQuery: vi.fn().mockReturnValue('new'),
  };
});

describe('CommentSection suspension notice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows suspension notice after submit attempt', async () => {
    const wrapper = mount(CommentSection, {
      props: {
        aggregateCommentCount: 0,
        commentSectionQueryVariables: {
          channelUniqueName: 'cats',
          limit: 5,
          offset: 0,
          sort: 'new',
        },
        comments: [],
        createCommentInput: {},
        createFormValues: { text: '', isRootComment: true, depth: 1 },
        enableFeedback: false,
        loading: false,
        locked: false,
        archived: false,
        reachedEndOfResults: true,
        previousOffset: 0,
        originalPoster: 'bob',
        showCommentSortButtons: false,
        answers: [{ id: 'a1' }],
      },
      global: {
        stubs: {
          Comment: { template: '<div />' },
          LoadMore: { template: '<div />' },
          WarningModal: { template: '<div />' },
          BrokenRulesModal: { template: '<div />' },
          GenericFeedbackFormModal: { template: '<div />' },
          Notification: { template: '<div />' },
          ConfirmUndoCommentFeedbackModal: { template: '<div />' },
          EditCommentFeedbackModal: { template: '<div />' },
          UnarchiveModal: { template: '<div />' },
          LockIcon: { template: '<div />' },
          SortButtons: { template: '<div />' },
          InfoBanner: { template: '<div />' },
          ErrorBanner: { template: '<div />' },
          SuspensionNotice: {
            template: '<div data-testid="suspension-notice"></div>',
            props: [
              'issueNumber',
              'channelId',
              'suspendedUntil',
              'suspendedIndefinitely',
              'message',
            ],
          },
          PinnedAnswers: {
            template:
              '<button data-testid="create-comment" @click="$emit(\'create-comment\')"></button>',
            props: ['answers'],
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(
      false
    );

    await wrapper.find('[data-testid="create-comment"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="suspension-notice"]').exists()).toBe(
      true
    );
  });
});
