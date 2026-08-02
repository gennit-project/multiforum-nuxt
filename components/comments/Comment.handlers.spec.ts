import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeComment } from '@/tests/utils/factories';
import type { Comment } from '@/__generated__/graphql';
import CommentComponent from '@/components/comments/Comment.vue';

let routeParams: Record<string, unknown> = {};
const copyLinkSpy = vi.fn((cb?: (v: boolean) => void) => cb?.(true));
const handleMarkAsBestAnswer = vi.fn();
const handleUnmarkAsBestAnswer = vi.fn();
let bestAnswerOptions: {
  discussionId: { value: unknown };
  onMarked: () => void;
  onUnmarked: () => void;
};
// useMutation is called for SUBSCRIBE_TO_COMMENT then UNSUBSCRIBE_FROM_COMMENT.
const mutateSpies: ReturnType<typeof vi.fn>[] = [];
let useMutationCall = 0;

vi.mock('nuxt/app', () => ({ useRoute: () => ({ params: routeParams }) }));
vi.mock('@/composables/useAuthState', () => ({
  useUsername: () => ({ value: 'alice' }),
}));
vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => {
    const index = useMutationCall++;
    const mutate = vi.fn();
    mutateSpies[index] = mutate;
    return {
      mutate,
      loading: { value: false },
      error: { value: null },
      onDone: vi.fn(),
      onError: vi.fn(),
    };
  },
}));
vi.mock('@/composables/useCommentPermissions', () => ({
  useCommentPermissions: () => ({
    userPermissions: ref({
      canReport: true,
      canGiveFeedback: true,
      canHideComment: true,
      canSuspendUser: true,
      isChannelOwner: true,
      isElevatedMod: true,
      isSuspendedMod: false,
      isSuspendedUser: false,
    }),
  }),
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
  useBestAnswerMutations: (options: typeof bestAnswerOptions) => {
    bestAnswerOptions = options;
    void options.discussionId.value;
    return {
      isDiscussionAuthor: ref(true),
      isMarkedAsAnswer: ref(false),
      handleMarkAsBestAnswer,
      handleUnmarkAsBestAnswer,
    };
  },
}));
vi.mock('@/composables/useCommentPermalink', () => ({
  useCommentPermalink: () => ({
    canShowPermalink: ref(true),
    permalinkObject: ref({ name: 'x', params: {} }),
    copyLink: copyLinkSpy,
  }),
}));
vi.mock('@/composables/useAutoUnsubscribe', () => ({
  useAutoUnsubscribe: vi.fn(),
}));

const stubs = {
  CommentHeader: { template: '<div />' },
  CommentButtons: {
    name: 'CommentButtons',
    emits: [
      'start-comment-save',
      'open-reply-editor',
      'hide-reply-editor',
      'open-edit-comment-editor',
      'hide-edit-comment-editor',
      'open-mod-profile',
      'save-edit',
      'handle-view-feedback',
    ],
    template: '<div class="comment-buttons-stub"><slot /></div>',
  },
  MarkdownPreview: { props: ['text'], template: '<div>{{ text }}</div>' },
  ArchivedCommentText: { template: '<div />' },
  TextEditor: { template: '<div />' },
  ChildComments: { template: '<div />' },
  ErrorBanner: { template: '<div />' },
  EllipsisHorizontal: { template: '<i />' },
  RightArrowIcon: { template: '<i />' },
  MenuButton: {
    props: ['items'],
    emits: [
      'handle-edit',
      'click-feedback',
      'click-undo-feedback',
      'click-edit-feedback',
    ],
    template: '<button data-testid="commentMenu"><slot /></button>',
  },
};

const baseComment = (overrides: Partial<Comment> = {}): Comment =>
  makeComment({
    id: 'c1',
    text: 'Hello world',
    CommentAuthor: { __typename: 'User', username: 'bob', displayName: 'Bob' },
    Channel: { uniqueName: 'cats' },
    ...overrides,
  } as Partial<Comment>);

const mountComment = (commentData: Comment = baseComment()) =>
  mountWithDefaults(CommentComponent, {
    props: {
      commentData,
      depth: 1,
      parentCommentId: 'parent-1',
      enableFeedback: true,
    },
    global: { stubs },
  });

const buttons = (wrapper: ReturnType<typeof mountComment>) =>
  wrapper.findComponent('.comment-buttons-stub');
const menu = (wrapper: ReturnType<typeof mountComment>) =>
  wrapper.findComponent('[data-testid="commentMenu"]');

beforeEach(() => {
  routeParams = {};
  copyLinkSpy.mockClear();
  handleMarkAsBestAnswer.mockClear();
  handleUnmarkAsBestAnswer.mockClear();
  mutateSpies.length = 0;
  useMutationCall = 0;
});

describe('Comment — CommentButtons handlers', () => {
  it('re-emits createComment from the reply editor', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('create-comment', 'parent-1');

    expect(wrapper.emitted('createComment')).toBeTruthy();
  });

  it('re-emits click-edit-comment when an edit is requested', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('click-edit-comment', baseComment());

    expect(wrapper.emitted('click-edit-comment')).toBeTruthy();
  });

  it('maps a new reply input to updateCreateReplyCommentInput', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('update-new-comment', {
      text: 'hi',
      parentCommentId: 'parent-1',
      depth: 2,
    });

    expect(wrapper.emitted('updateCreateReplyCommentInput')).toBeTruthy();
  });

  it('does not emit a reply update when the parent id is missing', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('update-new-comment', {
      text: 'hi',
      parentCommentId: '',
      depth: 2,
    });

    expect(wrapper.emitted('updateCreateReplyCommentInput')).toBeUndefined();
  });

  it('re-emits clickFeedback when feedback is given', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('click-feedback');

    expect(wrapper.emitted('clickFeedback')).toBeTruthy();
  });

  it('re-emits clickUndoFeedback', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('click-undo-feedback');

    expect(wrapper.emitted('clickUndoFeedback')).toBeTruthy();
  });

  it('re-emits clickEditFeedback', async () => {
    const wrapper = mountComment();
    await buttons(wrapper).vm.$emit('click-edit-feedback');

    expect(wrapper.emitted('clickEditFeedback')).toBeTruthy();
  });

  it('re-emits editor and save lifecycle events', async () => {
    const wrapper = mountComment();
    const commentButtons = buttons(wrapper);
    await commentButtons.vm.$emit('start-comment-save', 'saving');
    await commentButtons.vm.$emit('open-reply-editor', 'c1');
    await commentButtons.vm.$emit('hide-reply-editor');
    await commentButtons.vm.$emit('open-edit-comment-editor');
    await commentButtons.vm.$emit('hide-edit-comment-editor');
    await commentButtons.vm.$emit('open-mod-profile');
    await commentButtons.vm.$emit('save-edit');
    await commentButtons.vm.$emit('handle-view-feedback');
    expect({
      saving: wrapper.emitted('startCommentSave'),
      openReply: wrapper.emitted('openReplyEditor'),
      hideReply: wrapper.emitted('hideReplyEditor'),
      openEdit: wrapper.emitted('openEditCommentEditor'),
      hideEdit: wrapper.emitted('hideEditCommentEditor'),
      mod: wrapper.emitted('openModProfile'),
      save: wrapper.emitted('saveEdit'),
      feedback: wrapper.emitted('handleViewFeedback'),
    }).toEqual({
      saving: [['saving']],
      openReply: [['c1']],
      hideReply: [[]],
      openEdit: [['c1']],
      hideEdit: [[]],
      mod: [[]],
      save: [[]],
      feedback: [['c1']],
    });
  });
});

describe('Comment — MenuButton handlers', () => {
  it('reports the comment', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('click-report');

    expect(wrapper.emitted('clickReport')).toBeTruthy();
  });

  it('deletes the comment with reply count context', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-delete');

    expect(wrapper.emitted('delete-comment')).toBeTruthy();
  });

  it('copies the permalink and emits the copied notification', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('copy-link');

    expect(wrapper.emitted('showCopiedLinkNotification')).toBeTruthy();
  });

  it('subscribes to replies when watch is requested', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-watch-replies');

    expect(mutateSpies[0]).toHaveBeenCalledWith({ commentId: 'c1' });
  });

  it('unsubscribes from replies when unwatch is requested', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-unwatch-replies');

    expect(mutateSpies[1]).toHaveBeenCalledWith({ commentId: 'c1' });
  });

  it('marks the comment as the best answer', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-mark-as-best-answer');

    expect(handleMarkAsBestAnswer).toHaveBeenCalledTimes(1);
  });

  it('unmarks the comment as the best answer', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-unmark-as-best-answer');

    expect(handleUnmarkAsBestAnswer).toHaveBeenCalledTimes(1);
  });

  it('re-emits the archive request to the parent', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-click-archive');

    expect(wrapper.emitted('handleClickArchive')).toBeTruthy();
  });

  it('re-emits archive-and-suspend and unarchive requests to the parent', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-click-archive-and-suspend');
    await menu(wrapper).vm.$emit('handle-click-unarchive');

    expect({
      archiveAndSuspend: wrapper.emitted('handleClickArchiveAndSuspend'),
      unarchive: wrapper.emitted('handleClickUnarchive'),
    }).toEqual({
      archiveAndSuspend: [['c1']],
      unarchive: [['c1']],
    });
  });

  it('re-emits view feedback from the menu', async () => {
    const wrapper = mountComment();
    await menu(wrapper).vm.$emit('handle-view-feedback');

    expect(wrapper.emitted('handleViewFeedback')).toEqual([['c1']]);
  });

  it('routes edit and feedback actions from the menu', async () => {
    const wrapper = mountComment();
    const commentMenu = menu(wrapper);
    await commentMenu.vm.$emit('handle-edit');
    await commentMenu.vm.$emit('click-feedback');
    await commentMenu.vm.$emit('click-undo-feedback');
    await commentMenu.vm.$emit('click-edit-feedback');
    expect({
      edit: wrapper.emitted('click-edit-comment'),
      feedback: wrapper.emitted('clickFeedback'),
      undo: wrapper.emitted('clickUndoFeedback'),
      editFeedback: wrapper.emitted('clickEditFeedback'),
    }).toEqual({
      edit: [[expect.objectContaining({ id: 'c1' })]],
      feedback: [[expect.objectContaining({ parentCommentId: 'parent-1' })]],
      undo: [[expect.objectContaining({ parentCommentId: 'parent-1' })]],
      editFeedback: [
        [
          expect.objectContaining({
            commentData: expect.objectContaining({ id: 'c1' }),
          }),
        ],
      ],
    });
  });
});

describe('Comment — best answer notifications', () => {
  it.each([
    ['onMarked', 'showMarkedAsBestAnswerNotification'],
    ['onUnmarked', 'showUnmarkedAsBestAnswerNotification'],
  ] as const)('shows and clears the %s notification', (callback, eventName) => {
    vi.useFakeTimers();
    const wrapper = mountComment();
    bestAnswerOptions[callback]();
    vi.advanceTimersByTime(3000);
    expect(wrapper.emitted(eventName)).toEqual([[true], [false]]);
    vi.useRealTimers();
  });
});

describe('Comment — forum id resolution', () => {
  it('resolves the forum id from a related event channel', () => {
    const wrapper = mountComment(
      baseComment({
        Channel: undefined,
        DiscussionChannel: undefined,
        Event: { EventChannels: [{ channelUniqueName: 'events-forum' }] },
      } as unknown as Partial<Comment>)
    );

    expect(wrapper.find('.comment-buttons-stub').exists()).toBe(true);
  });

  it('falls back to the route forum id when the comment has no channel', () => {
    routeParams = { forumId: 'route-forum' };
    const wrapper = mountComment(
      baseComment({
        Channel: undefined,
        DiscussionChannel: undefined,
        Event: undefined,
      } as unknown as Partial<Comment>)
    );

    expect(wrapper.find('.comment-buttons-stub').exists()).toBe(true);
  });

  it.each([
    ['discussion-1', 'discussion-1'],
    [['discussion-2'], 'discussion-2'],
  ])('normalizes the route discussion id %j', (discussionId) => {
    routeParams = { discussionId };
    mountComment();
    expect(bestAnswerOptions.discussionId.value).toBe(
      Array.isArray(discussionId) ? discussionId[0] : discussionId
    );
  });
});
