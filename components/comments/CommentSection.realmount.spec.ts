import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  asMock,
  createQueryMock,
  configureApolloMocks,
} from '@/tests/utils/mockApollo';
import { makeComment } from '@/tests/utils/factories';
import type { Comment } from '@/__generated__/graphql';

import { useQuery, useMutation } from '@vue/apollo-composable';

import CommentSection from '@/components/comments/CommentSection.vue';

// Mock only the low-level deps; let the real composables (notifications, modals,
// feedback/crud mutations, suspension notice) run — they only need Apollo +
// route mocked, and exercising them is a coverage bonus.
vi.mock('@vue/apollo-composable', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(() => ({ params: {}, query: {} })),
  useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })),
}));
vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ({ value: '' }),
  useUsername: () => ({ value: '' }),
}));

const CommentStub = {
  name: 'Comment',
  props: ['commentData'],
  template: '<div class="comment-stub" />',
};
const LoadMoreStub = { name: 'LoadMore', template: '<div class="load-more-stub" />' };

const stubs = {
  Comment: CommentStub,
  LoadMore: LoadMoreStub,
  SortButtons: { template: '<div class="sort-buttons-stub" />' },
  PinnedAnswers: { template: '<div />' },
  WarningModal: { template: '<div />' },
  BrokenRulesModal: { template: '<div />' },
  GenericFeedbackFormModal: { template: '<div />' },
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
  },
  createCommentInput: {},
  createFormValues: { text: '', isRootComment: true, depth: 1 },
  reachedEndOfResults: false,
  previousOffset: 0,
  originalPoster: 'bob',
  aggregateCommentCount: 2,
  comments: [makeComment({ id: 'a' }), makeComment({ id: 'b' })],
  ...overrides,
});

const mountSection = (overrides: Record<string, unknown> = {}) => {
  configureApolloMocks({
    useQuery,
    useMutation,
    fallbackQuery: createQueryMock({}),
  });
  return mountWithDefaults(CommentSection, {
    props: baseProps(overrides),
    global: { stubs },
  });
};

describe('CommentSection (real mount)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(useQuery).mockReset();
    asMock(useMutation).mockReset();
  });

  it('renders one Comment per comment in order', () => {
    const wrapper = mountSection();
    const ids = wrapper
      .findAllComponents(CommentStub)
      .map((c) => (c.props('commentData') as Comment).id);
    expect(ids).toEqual(['a', 'b']);
  });

  it('renders no Comment when the list is empty (and not loading)', () => {
    const wrapper = mountSection({ comments: [], loading: false });
    expect(wrapper.findAllComponents(CommentStub)).toHaveLength(0);
  });

  it('renders the sort buttons', () => {
    const wrapper = mountSection();
    expect(wrapper.find('.sort-buttons-stub').exists()).toBe(true);
  });

  it('renders the load-more control', () => {
    const wrapper = mountSection();
    expect(wrapper.find('.load-more-stub').exists()).toBe(true);
  });
});
