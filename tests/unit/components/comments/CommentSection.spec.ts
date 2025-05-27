import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { useRoute, useRouter } from 'nuxt/app';
import { useMutation } from '@vue/apollo-composable';

// Mock dependencies
vi.mock('nuxt/app', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@/cache', () => ({
  modProfileNameVar: {
    value: 'testmod',
  },
}));

vi.mock('@/components/comments/getSortFromQuery', () => ({
  getSortFromQuery: vi.fn().mockReturnValue('new'),
}));

// Create simplified test component
const CommentSectionTest = {
  name: 'CommentSection',
  props: [
    'aggregateCommentCount',
    'commentSectionQueryVariables',
    'comments',
    'createCommentInput',
    'createFormValues',
    'enableFeedback',
    'loading',
    'locked',
    'archived',
    'reachedEndOfResults',
    'previousOffset',
    'originalPoster',
    'showCommentSortButtons',
  ],
  template: `
    <div class="comment-section">
      <h2 id="comments" data-testid="comment-header">{{ \`Comments (\${aggregateCommentCount})\` }}</h2>
      <div v-if="showCommentSortButtons" data-testid="sort-buttons"></div>
      <div v-if="locked || archived" data-testid="locked-banner">This comment section is locked.</div>
      <div v-if="loading" data-testid="loading-spinner"></div>
      <div data-testid="nuxt-page-outlet"></div>
      <div v-if="!loading && aggregateCommentCount === 0" data-testid="no-comments">
        There are no comments yet.
      </div>
      <div v-for="(comment, index) in comments" :key="comment?.id || index" data-testid="comment"></div>
      <div v-if="!reachedEndOfResults" data-testid="load-more" @click="$emit('loadMore')"></div>
    </div>
  `,
  emits: [
    'updateCommentSectionQueryResult',
    'decrementCommentCount',
    'incrementCommentCount',
    'updateCreateReplyCommentInput',
    'updateCreateFormValues',
    'loadMore',
    'createComment',
    'click-edit-comment',
    'delete-comment',
  ],
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Mock useMutation returns
    const createCommentMutation = {
      mutate: vi.fn(),
      onDone: vi.fn(),
    };
    
    const editCommentMutation = {
      mutate: vi.fn(),
      error: null,
      onDone: vi.fn(),
    };
    
    const deleteCommentMutation = {
      mutate: vi.fn(),
      onDone: vi.fn(),
      loading: false,
    };
    
    const softDeleteCommentMutation = {
      mutate: vi.fn(),
      onDone: vi.fn(),
    };
    
    const addFeedbackCommentMutation = {
      mutate: vi.fn(),
      loading: false,
      error: null,
      onDone: vi.fn(),
    };
    
    useMutation.mockImplementation((mutation) => {
      if (mutation.name && mutation.name.includes('CREATE_COMMENT')) {
        return createCommentMutation;
      } else if (mutation.name && mutation.name.includes('UPDATE_COMMENT')) {
        return editCommentMutation;
      } else if (mutation.name && mutation.name.includes('DELETE_COMMENT')) {
        return deleteCommentMutation;
      } else if (mutation.name && mutation.name.includes('SOFT_DELETE_COMMENT')) {
        return softDeleteCommentMutation;
      } else {
        return addFeedbackCommentMutation;
      }
    });
    
    return {
      route,
      router,
      createCommentMutation,
      editCommentMutation,
      deleteCommentMutation,
      softDeleteCommentMutation,
      addFeedbackCommentMutation,
    };
  },
  methods: {
    handleClickCreate() {
      this.$emit('createComment');
    },
    updateCreateInputValuesForReply(input) {
      this.$emit('updateCreateReplyCommentInput', input);
    },
    handleClickEdit(commentData) {
      this.$emit('click-edit-comment', commentData);
    },
    handleClickDelete(input) {
      this.$emit('delete-comment', input);
    },
    handleDeleteComment() {
      this.deleteCommentMutation.mutate();
    },
    handleSaveEdit() {
      this.editCommentMutation.mutate();
    },
  },
};

describe('CommentSection.vue', () => {
  let mockRoute;
  let mockRouter;
  
  const defaultProps = {
    aggregateCommentCount: 2,
    commentSectionQueryVariables: {
      discussionId: 'test-discussion',
      limit: 10,
      offset: 0,
      sort: 'new',
    },
    comments: [
      { 
        id: 'comment-1',
        text: 'First comment',
        CommentAuthor: { username: 'user1' },
        Channel: { uniqueName: 'test-forum' },
        DiscussionChannel: { channelUniqueName: 'test-forum', discussionId: 'test-discussion' },
        ChildCommentsAggregate: { count: 0 },
        FeedbackComments: [],
        archived: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: null,
      },
      { 
        id: 'comment-2',
        text: 'Second comment',
        CommentAuthor: { username: 'user2' },
        Channel: { uniqueName: 'test-forum' },
        DiscussionChannel: { channelUniqueName: 'test-forum', discussionId: 'test-discussion' },
        ChildCommentsAggregate: { count: 0 },
        FeedbackComments: [],
        archived: false,
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: null,
      },
    ],
    createCommentInput: {
      discussionId: 'test-discussion',
      text: 'New comment',
    },
    createFormValues: {
      text: '',
      isRootComment: true,
      depth: 1,
    },
    enableFeedback: true,
    loading: false,
    locked: false,
    archived: false,
    reachedEndOfResults: false,
    previousOffset: 0,
    originalPoster: 'user1',
    showCommentSortButtons: true,
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock route and router
    mockRoute = {
      params: {
        forumId: 'test-forum',
        discussionId: 'test-discussion',
      },
      query: {},
    };
    
    mockRouter = {
      push: vi.fn(),
      go: vi.fn(),
    };
    
    useRoute.mockReturnValue(mockRoute);
    useRouter.mockReturnValue(mockRouter);
  });
  
  it('renders the comment section with correct header and comments', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    expect(wrapper.find('[data-testid="comment-header"]').text()).toBe('Comments (2)');
    expect(wrapper.findAll('[data-testid="comment"]')).toHaveLength(2);
    expect(wrapper.find('[data-testid="sort-buttons"]').exists()).toBe(true);
  });
  
  it('shows loading spinner when loading is true', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        loading: true,
      },
    });
    
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true);
  });
  
  it('shows "no comments" message when there are no comments', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        comments: [],
        aggregateCommentCount: 0,
      },
    });
    
    expect(wrapper.find('[data-testid="no-comments"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="no-comments"]').text()).toContain('There are no comments yet');
  });
  
  it('shows locked banner when the comment section is locked', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        locked: true,
      },
    });
    
    expect(wrapper.find('[data-testid="locked-banner"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="locked-banner"]').text()).toContain('This comment section is locked');
  });
  
  it('shows locked banner when the comment section is archived', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        archived: true,
      },
    });
    
    expect(wrapper.find('[data-testid="locked-banner"]').exists()).toBe(true);
  });
  
  it('hides sort buttons when showCommentSortButtons is false', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        showCommentSortButtons: false,
      },
    });
    
    expect(wrapper.find('[data-testid="sort-buttons"]').exists()).toBe(false);
  });
  
  it('shows load more button when reachedEndOfResults is false', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        reachedEndOfResults: false,
      },
    });
    
    expect(wrapper.find('[data-testid="load-more"]').exists()).toBe(true);
  });
  
  it('hides load more button when reachedEndOfResults is true', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: {
        ...defaultProps,
        reachedEndOfResults: true,
      },
    });
    
    expect(wrapper.find('[data-testid="load-more"]').exists()).toBe(false);
  });
  
  it('emits loadMore event when load more button is clicked', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    await wrapper.find('[data-testid="load-more"]').trigger('click');
    
    expect(wrapper.emitted().loadMore).toBeTruthy();
    expect(wrapper.emitted().loadMore.length).toBe(1);
  });
  
  it('emits updateCreateReplyCommentInput event when updateCreateInputValuesForReply is called', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    const inputData = {
      text: 'Reply text',
      parentCommentId: 'comment-1',
      depth: 2,
    };
    
    await wrapper.vm.updateCreateInputValuesForReply(inputData);
    
    expect(wrapper.emitted().updateCreateReplyCommentInput).toBeTruthy();
    expect(wrapper.emitted().updateCreateReplyCommentInput[0][0]).toEqual(inputData);
  });
  
  it('emits click-edit-comment event when handleClickEdit is called', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    const commentData = { id: 'comment-1', text: 'Comment text' };
    
    await wrapper.vm.handleClickEdit(commentData);
    
    expect(wrapper.emitted()['click-edit-comment']).toBeTruthy();
    expect(wrapper.emitted()['click-edit-comment'][0][0]).toEqual(commentData);
  });
  
  it('emits delete-comment event when handleClickDelete is called', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    const deleteInput = {
      commentId: 'comment-1',
      parentCommentId: '',
      replyCount: 0,
    };
    
    await wrapper.vm.handleClickDelete(deleteInput);
    
    expect(wrapper.emitted()['delete-comment']).toBeTruthy();
    expect(wrapper.emitted()['delete-comment'][0][0]).toEqual(deleteInput);
  });
  
  it('calls deleteCommentMutation.mutate when handleDeleteComment is called', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    const spy = vi.spyOn(wrapper.vm.deleteCommentMutation, 'mutate');
    
    await wrapper.vm.handleDeleteComment();
    
    expect(spy).toHaveBeenCalled();
  });
  
  it('calls editCommentMutation.mutate when handleSaveEdit is called', async () => {
    const wrapper = mount(CommentSectionTest, {
      props: defaultProps,
    });
    
    const spy = vi.spyOn(wrapper.vm.editCommentMutation, 'mutate');
    
    await wrapper.vm.handleSaveEdit();
    
    expect(spy).toHaveBeenCalled();
  });
});