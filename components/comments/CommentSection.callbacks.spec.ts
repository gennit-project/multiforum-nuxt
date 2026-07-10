import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeComment } from '@/tests/utils/factories';
import { asMock, createMutationRouter } from '@/tests/utils/mockApollo';
import { useMutation } from '@vue/apollo-composable';
import CommentSection from '@/components/comments/CommentSection.vue';

// Route the comment CRUD + feedback mutations so their onDone / update callbacks
// (which fire CommentSection's own onCommentDeleted / onIncrement / onDecrement /
// onFeedbackAdded handlers) can be triggered directly.
const router = createMutationRouter([
  'createComment',
  'deleteComment',
  'addFeedbackCommentToComment',
]);

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({
    result: ref({}),
    loading: ref(false),
    error: ref(null),
    onResult: vi.fn(),
    refetch: vi.fn(),
  }),
  useMutation: vi.fn(),
}));
vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { discussionId: 'd1', forumId: 'cats' }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ({ value: 'mod-alice' }),
  useUsername: () => ({ value: 'alice' }),
}));

const NotificationStub = {
  name: 'Notification',
  props: ['show', 'title'],
  template: '<div class="notification-stub" :data-show="String(show)" :data-title="title" />',
};

const stubs = {
  Comment: { name: 'Comment', props: ['commentData'], template: '<div class="comment-stub" />' },
  LoadMore: { template: '<div />' },
  SortButtons: { template: '<div />' },
  PinnedAnswers: { name: 'PinnedAnswers', props: ['answers'], template: '<div />' },
  WarningModal: { template: '<div />' },
  BrokenRulesModal: { template: '<div />' },
  GenericFeedbackFormModal: { name: 'GenericFeedbackFormModal', props: ['open'], template: '<div class="feedback-modal-stub" />' },
  Notification: NotificationStub,
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
  answers: [] as unknown[],
  loading: false,
  enableFeedback: true,
  ...overrides,
});

const mountSection = (overrides: Record<string, unknown> = {}) =>
  mountWithDefaults(CommentSection, {
    props: baseProps(overrides),
    global: { stubs },
  });

const fakeCache = () => ({
  identify: vi.fn(() => 'DiscussionChannel:dc1'),
  modify: vi.fn(),
  evict: vi.fn(),
  gc: vi.fn(),
});

const feedbackToast = (wrapper: ReturnType<typeof mountSection>) =>
  wrapper
    .findAllComponents(NotificationStub)
    .find((n) => String(n.props('title')).includes('feedback was submitted'))!;

beforeEach(() => {
  router.reset();
  asMock(useMutation).mockImplementation(router.useMutation);
});

describe('CommentSection — mutation callbacks', () => {
  it('resets the create form when a comment is created', () => {
    const wrapper = mountSection();
    router.get('createComment').fireDone();
    expect(wrapper.emitted('updateCreateFormValues')).toBeTruthy();
  });

  it('emits incrementCommentCount from the create cache update', () => {
    const wrapper = mountSection();
    router.get('createComment').update!(fakeCache(), {
      data: {
        createComments: {
          comments: [{ __typename: 'Comment', id: 'new-1', ParentComment: null }],
        },
      },
    });
    expect(wrapper.emitted('incrementCommentCount')).toBeTruthy();
  });

  it('emits decrementCommentCount from the delete cache update', () => {
    const wrapper = mountSection();
    router.get('deleteComment').update!(fakeCache());
    expect(wrapper.emitted('decrementCommentCount')).toBeTruthy();
  });

  it('shows the success notification after feedback is added', async () => {
    const wrapper = mountSection();
    router.get('addFeedbackCommentToComment').fireDone();
    await wrapper.vm.$nextTick();
    expect(feedbackToast(wrapper).attributes('data-show')).toBe('true');
  });
});

describe('CommentSection — loaded-state watchers', () => {
  it('hides the loading spinner once comments arrive', async () => {
    const wrapper = mountSection({ comments: [], loading: true });
    const before = wrapper.find('[aria-busy="true"]').exists();
    await wrapper.setProps({ comments: [makeComment({ id: 'x1' })] });
    expect([before, wrapper.find('[aria-busy="true"]').exists()]).toEqual([true, false]);
  });

  it('hides the loading spinner once loading finishes', async () => {
    const wrapper = mountSection({ comments: [], loading: true });
    await wrapper.setProps({ loading: false });
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false);
  });
});
