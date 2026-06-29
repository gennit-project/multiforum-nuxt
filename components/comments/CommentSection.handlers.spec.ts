import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeComment } from '@/tests/utils/factories';
import CommentSection from '@/components/comments/CommentSection.vue';

const routerPush = vi.fn();

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({}),
    loading: ref(false),
    error: ref(null),
    onResult: vi.fn(),
    refetch: vi.fn(),
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    loading: ref(false),
    error: ref(null),
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { discussionId: 'd1', forumId: 'cats' }, query: {} }),
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ({ value: 'mod-alice' }),
  useUsername: () => ({ value: 'alice' }),
}));

const PinnedAnswersStub = {
  name: 'PinnedAnswers',
  props: ['answers'],
  template: '<div class="pinned-answers-stub" />',
};
const FeedbackModalStub = {
  name: 'GenericFeedbackFormModal',
  props: ['open'],
  template: '<div class="feedback-modal-stub" />',
};

const stubs = {
  Comment: { name: 'Comment', props: ['commentData'], template: '<div class="comment-stub" />' },
  LoadMore: { template: '<div />' },
  SortButtons: { template: '<div />' },
  PinnedAnswers: PinnedAnswersStub,
  WarningModal: { template: '<div />' },
  BrokenRulesModal: { template: '<div />' },
  GenericFeedbackFormModal: FeedbackModalStub,
  Notification: { template: '<div />' },
  ConfirmUndoCommentFeedbackModal: { template: '<div />' },
  EditCommentFeedbackModal: { template: '<div />' },
  UnarchiveModal: { template: '<div />' },
  LockIcon: { template: '<i />' },
  InfoBanner: { template: '<div />' },
  ErrorBanner: { template: '<div />' },
  SuspensionNotice: { template: '<div />' },
};

const baseProps = (overrides: Record<string, unknown> = {}) => ({
  commentSectionQueryVariables: {
    discussionId: 'd1',
    channelUniqueName: 'cats',
    limit: 50,
    offset: 0,
    sort: 'new',
  },
  comments: [makeComment({ id: 'c1', text: 'A comment' })],
  answers: [makeComment({ id: 'a1', text: 'An answer' })],
  loading: false,
  enableFeedback: true,
  ...overrides,
});

const mountSection = (overrides: Record<string, unknown> = {}) =>
  mountWithDefaults(CommentSection, {
    props: baseProps(overrides),
    global: { stubs },
  });

const pinned = (wrapper: ReturnType<typeof mountSection>) =>
  wrapper.findComponent('.pinned-answers-stub');
const feedbackModal = (wrapper: ReturnType<typeof mountSection>) =>
  wrapper.findComponent('.feedback-modal-stub');

beforeEach(() => {
  routerPush.mockReset();
});

describe('CommentSection — view feedback', () => {
  it('navigates to the comment feedback page', async () => {
    const wrapper = mountSection();
    await pinned(wrapper).vm.$emit('handle-view-feedback', 'c1');

    expect(routerPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId',
        params: expect.objectContaining({ forumId: 'cats', commentId: 'c1' }),
      })
    );
  });
});

describe('CommentSection — save edit guard', () => {
  it('logs an error when there is no comment to edit', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountSection();
    await pinned(wrapper).vm.$emit('save-edit');
    const called = errorSpy.mock.calls.some((c) => String(c[0]).includes('No comment to edit'));
    errorSpy.mockRestore();

    expect(called).toBe(true);
  });
});

describe('CommentSection — submit feedback guards', () => {
  it('blocks feedback submission when feedback is disabled', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountSection({ enableFeedback: false });
    await feedbackModal(wrapper).vm.$emit('primary-button-click');
    const called = errorSpy.mock.calls.some((c) =>
      String(c[0]).includes('Feedback is disabled')
    );
    errorSpy.mockRestore();

    expect(called).toBe(true);
  });

  it('blocks feedback submission when no comment is selected', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mountSection({ enableFeedback: true });
    await feedbackModal(wrapper).vm.$emit('primary-button-click');
    const called = errorSpy.mock.calls.some((c) =>
      String(c[0]).includes('commentId is required')
    );
    errorSpy.mockRestore();

    expect(called).toBe(true);
  });
});
