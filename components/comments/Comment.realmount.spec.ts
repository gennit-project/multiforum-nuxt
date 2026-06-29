import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeComment } from '@/tests/utils/factories';
import type { Comment } from '@/__generated__/graphql';

import Comment from '@/components/comments/Comment.vue';

vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: {} }) }));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    loading: { value: false },
    error: { value: null },
    onDone: vi.fn(),
    onError: vi.fn(),
  }),
}));
vi.mock('@/composables/useCommentPermissions', () => ({
  useCommentPermissions: () => ({ userPermissions: ref({}) }),
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
vi.mock('@/composables/useBestAnswerMutations', () => ({
  useBestAnswerMutations: () => ({
    isDiscussionAuthor: ref(false),
    isMarkedAsAnswer: ref(false),
    handleMarkAsBestAnswer: vi.fn(),
    handleUnmarkAsBestAnswer: vi.fn(),
  }),
}));
vi.mock('@/composables/useCommentPermalink', () => ({
  useCommentPermalink: () => ({
    canShowPermalink: ref(true),
    permalinkObject: ref({}),
    copyLink: vi.fn(),
  }),
}));
vi.mock('@/composables/useAutoUnsubscribe', () => ({ useAutoUnsubscribe: vi.fn() }));

const stubs = {
  CommentHeader: { template: '<div class="comment-header-stub" />' },
  CommentButtons: { template: '<div class="comment-buttons-stub" />' },
  MarkdownPreview: { props: ['text'], template: '<div class="md-stub">{{ text }}</div>' },
  ArchivedCommentText: { template: '<div class="archived-stub" />' },
  TextEditor: {
    name: 'TextEditor',
    props: ['initialValue'],
    emits: ['update'],
    template: '<div class="text-editor-stub">{{ initialValue }}</div>',
  },
  ChildComments: {
    name: 'ChildComments',
    template:
      '<div class="child-comments-stub"><slot :comments="[{ id: \'child-1\', text: \'Child body\', CommentAuthor: { __typename: \'User\', username: \'child\' }, Channel: { uniqueName: \'cats\' } }]" /></div>',
  },
  ErrorBanner: {
    name: 'ErrorBanner',
    props: ['text'],
    template: '<div class="error-banner-stub">{{ text }}</div>',
  },
  EllipsisHorizontal: { template: '<i />' },
  RightArrowIcon: { template: '<i />' },
  MenuButton: { template: '<button><slot /></button>' },
};

const baseComment = (overrides: Partial<Comment> = {}): Comment =>
  makeComment({
    id: 'c1',
    text: 'Hello world',
    CommentAuthor: {
      __typename: 'User',
      username: 'bob',
      displayName: 'Bob',
    },
    Channel: { uniqueName: 'cats' },
    ...overrides,
  } as Partial<Comment>);

const mountComment = (commentData: Comment) =>
  mountWithDefaults(Comment, {
    props: { commentData, depth: 1 },
    global: { stubs },
  });

describe('Comment (real mount)', () => {
  it('renders the comment container', () => {
    const wrapper = mountComment(baseComment());
    expect(wrapper.find('[data-testid="comment"]').exists()).toBe(true);
  });

  it('renders the comment text via the markdown preview', () => {
    const wrapper = mountComment(baseComment({ text: 'A unique body' } as Partial<Comment>));
    expect(wrapper.text()).toContain('A unique body');
  });

  it('shows the archived text for an archived comment', () => {
    const wrapper = mountComment(baseComment({ archived: true } as Partial<Comment>));
    expect(wrapper.find('.archived-stub').exists()).toBe(true);
  });

  it('shows the edit form and edit error for the active comment', () => {
    const wrapper = mountWithDefaults(Comment, {
      props: {
        commentData: baseComment({ text: 'Original body' } as Partial<Comment>),
        depth: 1,
        editFormOpenAtCommentID: 'c1',
        editCommentError: { message: 'Could not save' },
      },
      global: { stubs },
    });

    expect({
      editor: wrapper.get('.text-editor-stub').text(),
      error: wrapper.get('.error-banner-stub').text(),
    }).toEqual({
      editor: 'Original body',
      error: 'Could not save',
    });
  });

  it('emits edit text updates from the active edit form', async () => {
    const wrapper = mountWithDefaults(Comment, {
      props: {
        commentData: baseComment({ text: 'Original body' } as Partial<Comment>),
        depth: 1,
        editFormOpenAtCommentID: 'c1',
      },
      global: { stubs },
    });

    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit('update', 'edited');

    expect(wrapper.emitted('update-edit-comment-input')).toEqual([
      ['edited', true],
    ]);
  });

  it('renders comment buttons when a forum id resolves from the channel', () => {
    const wrapper = mountComment(baseComment());
    expect(wrapper.find('.comment-buttons-stub').exists()).toBe(true);
  });

  it('resolves the forum id from the discussion channel as a fallback', () => {
    const wrapper = mountComment(
      baseComment({
        Channel: undefined,
        DiscussionChannel: { channelUniqueName: 'dogs' },
      } as unknown as Partial<Comment>)
    );
    expect(wrapper.find('.comment-buttons-stub').exists()).toBe(true);
  });

  it('hides comment buttons when no forum id can be resolved', () => {
    const wrapper = mountComment(
      baseComment({
        Channel: undefined,
        DiscussionChannel: undefined,
        Event: undefined,
      } as unknown as Partial<Comment>)
    );
    expect(wrapper.find('.comment-buttons-stub').exists()).toBe(false);
  });

  it('hides comment buttons when showCommentButtons is false', () => {
    const wrapper = mountWithDefaults(Comment, {
      props: {
        commentData: baseComment(),
        depth: 1,
        showCommentButtons: false,
      },
      global: { stubs },
    });

    expect(wrapper.find('.comment-buttons-stub').exists()).toBe(false);
  });

  it('renders child comments while replies are visible', () => {
    const wrapper = mountComment(
      baseComment({
        ChildCommentsAggregate: { count: 1 },
      } as unknown as Partial<Comment>)
    );

    expect(wrapper.text()).toContain('Child body');
  });

  it('renders a continue-thread link when reply depth exceeds the inline limit', async () => {
    const wrapper = mountWithDefaults(Comment, {
      props: {
        commentData: baseComment({
          ChildCommentsAggregate: { count: 1 },
        } as unknown as Partial<Comment>),
        depth: 5,
      },
      global: { stubs },
    });

    await wrapper.get('a').trigger('click');

    expect({
      text: wrapper.text(),
      scroll: wrapper.emitted('scrollToTop'),
    }).toEqual({
      text: expect.stringContaining('Continue thread'),
      scroll: [[]],
    });
  });
});
