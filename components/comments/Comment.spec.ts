import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { textEditorStub, errorBannerStub } from '@/tests/utils/componentStubs';
import Comment from '@/components/comments/Comment.vue';

const h = vi.hoisted(() => ({
  route: {
    params: {
      discussionId: 'd1',
      commentId: '',
      forumId: 'cats',
    },
  },
  commentMenuItems: [{ label: 'Copy Link', event: 'copyLink' }],
  copyLink: vi.fn(async (notify: (value: boolean) => void) => {
    notify(true);
  }),
  subscribeToComment: vi.fn(),
  unsubscribeFromComment: vi.fn(),
  stickyComment: vi.fn(),
  unstickyComment: vi.fn(),
  handleMarkAsBestAnswer: vi.fn(),
  handleUnmarkAsBestAnswer: vi.fn(),
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => h.route,
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: (mutation: string) => ({
    mutate:
      mutation === 'SUBSCRIBE_TO_COMMENT'
        ? h.subscribeToComment
        : mutation === 'UNSUBSCRIBE_FROM_COMMENT'
          ? h.unsubscribeFromComment
          : mutation === 'STICKY_COMMENT'
            ? h.stickyComment
            : h.unstickyComment,
  }),
}));

vi.mock('@/graphQLData/comment/mutations', () => ({
  SUBSCRIBE_TO_COMMENT: 'SUBSCRIBE_TO_COMMENT',
  UNSUBSCRIBE_FROM_COMMENT: 'UNSUBSCRIBE_FROM_COMMENT',
  STICKY_COMMENT: 'STICKY_COMMENT',
  UNSTICKY_COMMENT: 'UNSTICKY_COMMENT',
}));

vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ref('alice'),
}));

vi.mock('@/composables/useCommentPermissions', () => ({
  useCommentPermissions: () => ({
    userPermissions: ref({}),
  }),
}));

vi.mock('@/composables/useBestAnswerMutations', () => ({
  useBestAnswerMutations: () => ({
    isDiscussionAuthor: ref(false),
    isMarkedAsAnswer: ref(false),
    handleMarkAsBestAnswer: h.handleMarkAsBestAnswer,
    handleUnmarkAsBestAnswer: h.handleUnmarkAsBestAnswer,
  }),
}));

vi.mock('@/composables/useCommentPermalink', () => ({
  useCommentPermalink: () => ({
    canShowPermalink: ref(true),
    permalinkObject: ref({ name: 'discussion-comment' }),
    copyLink: h.copyLink,
  }),
}));

vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: vi.fn(),
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

vi.mock('@/utils/headerPermissionUtils', () => ({
  getCommentMenuItems: () => h.commentMenuItems,
}));

vi.mock('@/utils/roleBadges', () => ({
  getAuthorBadges: () => ({
    isServerAdmin: false,
    isServerMod: false,
    isForumAdmin: false,
    isForumMod: false,
  }),
}));

vi.mock('@/utils/commentDisplay', () => ({
  getCommentReplyCount: (comment: { replyCount?: number }) => comment.replyCount ?? 0,
  isCommentSubscribedByUser: () => false,
  isCommentOwnedByUser: (comment: { CommentAuthor?: { username?: string } }, username: string) =>
    comment.CommentAuthor?.username === username,
  getCommentFeedbackLabel: () => 'Critique',
}));

const CommentHeaderStub = {
  name: 'CommentHeader',
  props: ['label', 'isHighlighted'],
  template: '<div class="comment-header">{{ label }} {{ isHighlighted }}</div>',
};

const CommentButtonsStub = {
  name: 'CommentButtons',
  emits: ['click-feedback', 'hide-replies', 'show-replies'],
  template:
    '<div class="comment-buttons"><slot /><button class="feedback-button" @click="$emit(\'click-feedback\')" /><button class="hide-replies-button" @click="$emit(\'hide-replies\')" /><button class="show-replies-button" @click="$emit(\'show-replies\')" /></div>',
};

const MenuButtonStub = {
  name: 'MenuButton',
  props: ['items'],
  emits: [
    'copy-link',
    'handle-delete',
    'handle-watch-replies',
    'handle-unwatch-replies',
    'handle-sticky-comment',
    'handle-unsticky-comment',
  ],
  template:
    '<div><button class="copy-link-button" @click="$emit(\'copy-link\')" /><button class="delete-button" @click="$emit(\'handle-delete\')" /><button class="watch-button" @click="$emit(\'handle-watch-replies\')" /><button class="unwatch-button" @click="$emit(\'handle-unwatch-replies\')" /><button class="sticky-button" @click="$emit(\'handle-sticky-comment\')" /><button class="unsticky-button" @click="$emit(\'handle-unsticky-comment\')" /></div>',
};

const inert = (name: string) => ({
  name,
  template: `<div data-stub="${name}" />`,
});

const makeComment = (overrides: Record<string, unknown> = {}) =>
  ({
    __typename: 'Comment',
    id: 'c1',
    text: 'Original comment text',
    archived: false,
    replyCount: 0,
    CommentAuthor: {
      __typename: 'User',
      username: 'alice',
      displayName: 'Alice',
    },
    Channel: {
      uniqueName: 'cats',
    },
    DiscussionChannel: {
      channelUniqueName: 'cats',
      discussionId: 'd1',
    },
    FeedbackComments: [],
    ...overrides,
  });

const ChildCommentsStub = {
  name: 'ChildComments',
  template:
    '<div class="child-comments-stub"><slot :comments="[{ id: \'child-1\', text: \'Child text\', archived: false, replyCount: 0, CommentAuthor: { __typename: \'User\', username: \'bob\', displayName: \'Bob\' }, Channel: { uniqueName: \'cats\' }, DiscussionChannel: { channelUniqueName: \'cats\', discussionId: \'d1\' }, FeedbackComments: [] }]" /></div>',
};

const mountComment = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(Comment, {
    props: {
      commentData: makeComment(),
      depth: 1,
      parentCommentId: 'parent-1',
      answers: [],
      ...props,
    },
    global: {
      stubs: {
        CommentHeader: CommentHeaderStub,
        CommentButtons: CommentButtonsStub,
        MenuButton: MenuButtonStub,
        MarkdownPreview: inert('MarkdownPreview'),
        ArchivedCommentText: inert('ArchivedCommentText'),
        ChildComments: ChildCommentsStub,
        TextEditor: textEditorStub,
        ErrorBanner: errorBannerStub,
        EllipsisHorizontal: true,
        RightArrowIcon: true,
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  h.route.params.commentId = '';
  h.commentMenuItems = [{ label: 'Copy Link', event: 'copyLink' }];
});

describe('Comment', () => {
  it('passes the computed feedback label to the header', () => {
    const wrapper = mountComment({ showLabel: true });

    expect(wrapper.findComponent(CommentHeaderStub).props('label')).toBe('Critique');
  });

  it('renders archived text instead of the markdown preview for archived comments', () => {
    const wrapper = mountComment({
      commentData: makeComment({ archived: true }),
    });

    expect({
      archived: wrapper.find('[data-stub="ArchivedCommentText"]').exists(),
      preview: wrapper.find('[data-stub="MarkdownPreview"]').exists(),
    }).toEqual({
      archived: true,
      preview: false,
    });
  });

  it('emits update-edit-comment-input when the edit form changes', async () => {
    const wrapper = mountComment({
      editFormOpenAtCommentID: 'c1',
    });

    await wrapper.findComponent(textEditorStub).vm.$emit('update', 'Updated text');

    expect(wrapper.emitted('update-edit-comment-input')).toEqual([
      ['Updated text', true],
    ]);
  });

  it('forwards feedback clicks with the comment and parent ids', async () => {
    const wrapper = mountComment();

    await wrapper.get('.feedback-button').trigger('click');

    expect(wrapper.emitted('clickFeedback')).toEqual([
      [
        {
          commentData: expect.objectContaining({ id: 'c1' }),
          parentCommentId: 'parent-1',
        },
      ],
    ]);
  });

  it('emits copied-link notifications when the menu requests a permalink copy', async () => {
    const wrapper = mountComment();

    await wrapper.get('.copy-link-button').trigger('click');

    expect(wrapper.emitted('showCopiedLinkNotification')).toEqual([[
      true,
    ]]);
  });

  it('shows the continue-thread link when replies exceed the inline depth limit', () => {
    const wrapper = mountComment({
      depth: 5,
      commentData: makeComment({ replyCount: 2 }),
    });

    expect(wrapper.text()).toContain('Continue thread');
  });

  it('highlights the header when the route permalink matches the comment id', () => {
    h.route.params.commentId = 'c1';
    const wrapper = mountComment();

    expect(wrapper.findComponent(CommentHeaderStub).props('isHighlighted')).toBe(
      true
    );
  });

  it('renders the edit error banner while the edit form is open', () => {
    const wrapper = mountComment({
      editFormOpenAtCommentID: 'c1',
      editCommentError: { message: 'Edit failed' },
    });

    expect(wrapper.text()).toContain('Edit failed');
  });

  it('emits delete-comment with the computed reply count from the menu action', async () => {
    const wrapper = mountComment({
      commentData: makeComment({ replyCount: 3 }),
    });

    await wrapper.get('.delete-button').trigger('click');

    expect(wrapper.emitted('delete-comment')).toEqual([
      [
        {
          commentId: 'c1',
          parentCommentId: 'parent-1',
          replyCount: 3,
        },
      ],
    ]);
  });

  it('subscribes to comment replies from the menu action', async () => {
    const wrapper = mountComment();

    await wrapper.get('.watch-button').trigger('click');

    expect(h.subscribeToComment).toHaveBeenCalledWith({ commentId: 'c1' });
  });

  it('unsubscribes from comment replies from the menu action', async () => {
    const wrapper = mountComment();

    await wrapper.get('.unwatch-button').trigger('click');

    expect(h.unsubscribeFromComment).toHaveBeenCalledWith({ commentId: 'c1' });
  });

  it('toggles sticky state from the menu actions', async () => {
    const wrapper = mountComment();

    await wrapper.get('.sticky-button').trigger('click');
    await wrapper.get('.unsticky-button').trigger('click');

    expect(h.stickyComment).toHaveBeenCalledWith({ commentId: 'c1' });
    expect(h.unstickyComment).toHaveBeenCalledWith({ commentId: 'c1' });
  });

  it('renders child comments when replies are shown within the depth limit', () => {
    const wrapper = mountComment({
      commentData: makeComment({ replyCount: 1 }),
      depth: 1,
    });

    expect(wrapper.findAll('[data-testid="comment"]')).toHaveLength(2);
  });

  it('hides and re-shows child comments from the comment buttons', async () => {
    const wrapper = mountComment({
      commentData: makeComment({ replyCount: 1 }),
      depth: 1,
    });

    expect(wrapper.findAll('[data-testid="comment"]')).toHaveLength(2);
    await wrapper.get('.hide-replies-button').trigger('click');
    expect(wrapper.findAll('[data-testid="comment"]')).toHaveLength(1);

    await wrapper.get('.show-replies-button').trigger('click');
    expect(wrapper.findAll('[data-testid="comment"]')).toHaveLength(2);
  });
});
