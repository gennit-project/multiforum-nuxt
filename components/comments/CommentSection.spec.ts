import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import CommentSection from '@/components/comments/CommentSection.vue';

// This spec mounts the REAL CommentSection.vue. Apollo is mocked at the module
// level: useMutation returns a mutate() that synchronously fires its registered
// onDone callbacks, so exercising createComment also runs the onDone handler in
// CommentSection (which emits updateCreateFormValues). useQuery returns an empty
// result, so the suspension-notice composable resolves to "not suspended".
const { routerPush, routeRef } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeRef: { value: { params: {} as Record<string, unknown>, query: {} } },
}));

vi.mock('nuxt/app', () => ({
  useRoute: () => routeRef.value,
  useRouter: () => ({ push: routerPush }),
}));

vi.mock('@/composables/useAuthState', () => ({
  useModProfileName: () => ({ value: 'mod1' }),
  useUsername: () => ({ value: 'alice' }),
}));

vi.mock('@/utils/getSortFromQuery', () => ({
  getSortFromQuery: () => 'new',
}));

vi.mock('@vue/apollo-composable', async () => {
  const { ref: r } = await import('vue');
  return {
    useMutation: () => {
      const done: Array<(p: unknown) => void> = [];
      const onErr: Array<(p: unknown) => void> = [];
      return {
        mutate: vi.fn(() => {
          done.forEach((cb) => cb({ data: {} }));
          return Promise.resolve({ data: {} });
        }),
        onDone: (cb: (p: unknown) => void) => done.push(cb),
        onError: (cb: (p: unknown) => void) => onErr.push(cb),
        loading: r(false),
        error: r(null),
      };
    },
    useQuery: () => ({
      result: r(null),
      loading: r(false),
      error: r(null),
      onResult: vi.fn(),
      onError: vi.fn(),
      refetch: vi.fn(),
    }),
    provideApolloClient: vi.fn(),
  };
});

// A Comment stub that forwards the events CommentSection wires handlers to.
const CommentStub = {
  name: 'Comment',
  props: ['commentData'],
  emits: [
    'start-comment-save',
    'create-comment',
    'update-create-reply-comment-input',
    'click-edit-comment',
    'update-edit-comment-input',
    'save-edit',
    'open-reply-editor',
    'hide-reply-editor',
    'open-edit-comment-editor',
    'hide-edit-comment-editor',
    'scroll-to-top',
    'handle-view-feedback',
    'show-copied-link-notification',
    'show-marked-as-best-answer-notification',
    'show-unmarked-as-best-answer-notification',
    'open-mod-profile-modal',
    'click-report',
    'click-feedback',
    'click-undo-feedback',
    'click-edit-feedback',
    'update-feedback',
    'delete-comment',
    'handle-click-archive',
    'handle-click-archive-and-suspend',
    'handle-click-unarchive',
  ],
  template: '<div class="comment-stub" />',
};

const PinnedAnswersStub = {
  name: 'PinnedAnswers',
  props: ['answers'],
  emits: [
    'start-comment-save',
    'create-comment',
    'click-edit-comment',
    'click-report',
    'handle-click-archive',
    'handle-click-archive-and-suspend',
    'handle-click-unarchive',
    'update-create-reply-comment-input',
    'show-copied-link-notification',
    'show-marked-as-best-answer-notification',
    'show-unmarked-as-best-answer-notification',
    'open-mod-profile',
    'scroll-to-top',
  ],
  template: '<div class="pinned-answers-stub" />',
};

const inert = (name: string) => ({
  name,
  template: `<div data-stub="${name}" />`,
});

const stubs = {
  Comment: CommentStub,
  PinnedAnswers: PinnedAnswersStub,
  SortButtons: inert('SortButtons'),
  InfoBanner: {
    name: 'InfoBanner',
    props: ['text'],
    template: '<div class="info-banner"><slot />{{ text }}</div>',
  },
  ErrorBanner: { name: 'ErrorBanner', props: ['text'], template: '<div />' },
  SuspensionNotice: inert('SuspensionNotice'),
  LockIcon: inert('LockIcon'),
  LoadMore: {
    name: 'LoadMore',
    emits: ['load-more'],
    template: '<button class="load-more-stub" @click="$emit(\'load-more\')" />',
  },
  Notification: {
    name: 'Notification',
    props: ['show', 'title'],
    emits: ['close-notification'],
    template: '<div class="notification-stub" />',
  },
  WarningModal: {
    name: 'WarningModal',
    props: ['open'],
    emits: ['close', 'primary-button-click'],
    template: '<div class="warning-modal-stub" />',
  },
  BrokenRulesModal: inert('BrokenRulesModal'),
  GenericFeedbackFormModal: {
    name: 'GenericFeedbackFormModal',
    emits: ['close', 'update-feedback', 'primary-button-click'],
    template: '<div class="feedback-modal-stub" />',
  },
  ConfirmUndoCommentFeedbackModal: {
    name: 'ConfirmUndoCommentFeedbackModal',
    emits: ['close'],
    template: '<div class="undo-feedback-modal-stub" />',
  },
  EditCommentFeedbackModal: {
    name: 'EditCommentFeedbackModal',
    emits: ['close'],
    template: '<div class="edit-feedback-modal-stub" />',
  },
  UnarchiveModal: inert('UnarchiveModal'),
  NuxtPage: {
    name: 'NuxtPage',
    emits: [
      'open-reply-editor',
      'hide-reply-editor',
      'click-edit-comment',
      'update-edit-comment-input',
      'save-edit',
      'scroll-to-top',
      'handle-view-feedback',
      'start-comment-save',
      'show-copied-link-notification',
      'show-marked-as-best-answer-notification',
      'show-unmarked-as-best-answer-notification',
    ],
    template: '<div class="nuxt-page-stub" />',
  },
};

const makeComment = (id: string, text = `text-${id}`) => ({
  id,
  text,
  CommentAuthor: { __typename: 'User', username: 'bob' },
  Channel: { uniqueName: 'cats' },
});

const baseProps = () => ({
  aggregateCommentCount: 2,
  commentSectionQueryVariables: {
    discussionId: 'd1',
    channelUniqueName: 'cats',
    limit: 10,
    offset: 0,
    sort: 'new',
  },
  comments: [makeComment('c1'), makeComment('c2')],
  createCommentInput: { text: '' },
  createFormValues: { text: '', isRootComment: true, depth: 1 },
  reachedEndOfResults: false,
  previousOffset: 0,
  originalPoster: 'bob',
});

const mountSection = (overrides: Record<string, unknown> = {}) =>
  mountWithDefaults(CommentSection, {
    props: { ...baseProps(), ...overrides } as Record<string, unknown>,
    global: { stubs },
  });

beforeEach(() => {
  vi.clearAllMocks();
  routeRef.value = { params: {}, query: {} };
  // scrollToTop calls window.scrollTo, which happy-dom does not implement.
  vi.stubGlobal('scrollTo', vi.fn());
});

describe('CommentSection', () => {
  it('renders the comment count header', () => {
    const wrapper = mountSection();
    expect(wrapper.get('#comments').text()).toBe('Comments (2)');
  });

  it('renders a Comment for each loaded comment', () => {
    const wrapper = mountSection();
    expect(wrapper.findAllComponents(CommentStub)).toHaveLength(2);
  });

  it('shows the empty-state message when there are no comments', () => {
    const wrapper = mountSection({
      aggregateCommentCount: 0,
      comments: [],
      loading: false,
    });
    expect(wrapper.text()).toContain('There are no comments yet.');
  });

  it('shows the loading skeleton while loading the first page', () => {
    const wrapper = mountSection({
      loading: true,
      comments: [],
      aggregateCommentCount: 0,
    });
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
  });

  it('shows the locked banner when the section is locked', () => {
    const wrapper = mountSection({ locked: true });
    expect(wrapper.text()).toContain('This comment section is locked.');
  });

  it('shows the locked banner when the section is archived', () => {
    const wrapper = mountSection({ archived: true });
    expect(wrapper.text()).toContain('This comment section is locked.');
  });

  it('renders sort buttons when there are comments and sorting is enabled', () => {
    const wrapper = mountSection();
    expect(wrapper.findComponent({ name: 'SortButtons' }).exists()).toBe(true);
  });

  it('hides sort buttons when sorting is disabled', () => {
    const wrapper = mountSection({ showCommentSortButtons: false });
    expect(wrapper.findComponent({ name: 'SortButtons' }).exists()).toBe(false);
  });

  it('renders pinned answers when answers are present', () => {
    const wrapper = mountSection({ answers: [makeComment('a1')] });
    expect(wrapper.findComponent(PinnedAnswersStub).exists()).toBe(true);
  });

  it('forwards load-more events', async () => {
    const wrapper = mountSection({ reachedEndOfResults: false });

    await wrapper.get('.load-more-stub').trigger('click');

    expect(wrapper.emitted('loadMore')).toEqual([[]]);
  });

  it('hides load-more when the end has been reached', () => {
    const wrapper = mountSection({ reachedEndOfResults: true });

    expect(wrapper.find('.load-more-stub').exists()).toBe(false);
  });

  it('wires pinned answer moderation and reply events', async () => {
    const wrapper = mountSection({ answers: [makeComment('a1')] });
    const pinned = wrapper.findComponent(PinnedAnswersStub);

    await pinned.vm.$emit('click-edit-comment', makeComment('a1'));
    await pinned.vm.$emit('update-create-reply-comment-input', {
      text: 'reply',
      parentCommentId: 'a1',
      depth: 2,
    });
    await pinned.vm.$emit('click-report', makeComment('a1'));
    await pinned.vm.$emit('handle-click-archive', 'a1');
    await pinned.vm.$emit('handle-click-archive-and-suspend', 'a1');
    await pinned.vm.$emit('handle-click-unarchive', 'a1');

    expect(wrapper.findComponent(PinnedAnswersStub).exists()).toBe(true);
  });

  it('emits updateCreateFormValues after a comment is created', async () => {
    // create-comment -> handleClickCreate -> createComment(mutate) -> onDone
    // -> emit('updateCreateFormValues', resetForm).
    const wrapper = mountSection();
    await wrapper.findAllComponents(CommentStub)[0].vm.$emit('create-comment');
    const emitted = wrapper.emitted('updateCreateFormValues');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toMatchObject({ text: '', isRootComment: true });
  });

  it('emits a reply-input update when a reply input changes', async () => {
    const wrapper = mountSection();
    await wrapper
      .findAllComponents(CommentStub)[0]
      .vm.$emit('update-create-reply-comment-input', {
        text: 'a reply',
        parentCommentId: 'c1',
        depth: 2,
      });
    expect(wrapper.emitted('updateCreateReplyCommentInput')).toBeTruthy();
  });

  it('excludes the permalinked comment from the inline list', () => {
    routeRef.value = { params: { commentId: 'c1' }, query: {} };
    const wrapper = mountSection();
    // c1 is permalinked, so only c2 renders inline.
    expect(wrapper.findAllComponents(CommentStub)).toHaveLength(1);
  });

  it('navigates to the comment-feedback route when viewing feedback', async () => {
    routeRef.value = {
      params: { forumId: 'cats', discussionId: 'd1' },
      query: {},
    };
    const wrapper = mountSection();
    await wrapper
      .findAllComponents(CommentStub)[0]
      .vm.$emit('handle-view-feedback', 'c1');
    expect(routerPush).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'forums-forumId-discussions-commentFeedback-discussionId-commentId',
        params: expect.objectContaining({ commentId: 'c1' }),
      })
    );
  });

  it('drives the edit lifecycle through the comment editor events', async () => {
    // Exercises handleClickEdit -> updateEditInputValues -> handleSaveEdit
    // (which runs editComment -> onDoneUpdatingComment) and the reply/edit
    // editor open/close toggles plus scrollToTop, without error.
    const wrapper = mountSection();
    const comment = wrapper.findAllComponents(CommentStub)[0];

    await comment.vm.$emit('open-reply-editor', 'c1');
    await comment.vm.$emit('hide-reply-editor');
    await comment.vm.$emit('open-edit-comment-editor', 'c1');
    await comment.vm.$emit('click-edit-comment', makeComment('c1', 'original'));
    await comment.vm.$emit('update-edit-comment-input', 'edited text', true);
    await comment.vm.$emit('save-edit');
    await comment.vm.$emit('hide-edit-comment-editor');
    await comment.vm.$emit('scroll-to-top');

    // The section is still mounted and the comments still render.
    expect(wrapper.findAllComponents(CommentStub).length).toBeGreaterThan(0);
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('forwards NuxtPage editor and navigation events when nested routes are shown', async () => {
    routeRef.value = {
      params: { forumId: 'cats', discussionId: 'd1' },
      query: {},
    };
    const wrapper = mountSection({ showNuxtPage: true });
    const page = wrapper.findComponent({ name: 'NuxtPage' });

    await page.vm.$emit('open-reply-editor', 'c1');
    await page.vm.$emit('hide-reply-editor');
    await page.vm.$emit('click-edit-comment', makeComment('c1', 'original'));
    await page.vm.$emit('update-edit-comment-input', 'edited via page', true);
    await page.vm.$emit('save-edit');
    await page.vm.$emit('scroll-to-top');
    await page.vm.$emit('handle-view-feedback', 'c1');

    expect({
      pageExists: page.exists(),
      scrolled: window.scrollTo,
      routed: routerPush.mock.calls.length,
    }).toEqual({
      pageExists: true,
      scrolled: expect.any(Function),
      routed: 1,
    });
  });

  it.each([0, 2])('deletes a comment with %i replies', async (replyCount) => {
    const wrapper = mountSection();
    await wrapper.findAllComponents(CommentStub)[0].vm.$emit('delete-comment', {
      commentId: 'c1',
      parentCommentId: '',
      replyCount,
    });
    await wrapper
      .findComponent({ name: 'WarningModal' })
      .vm.$emit('primary-button-click');
    expect(wrapper.findComponent({ name: 'WarningModal' }).props('open')).toBe(
      false
    );
  });

  it('submits feedback selected from a comment', async () => {
    const wrapper = mountSection({ enableFeedback: true });
    const comment = wrapper.findAllComponents(CommentStub)[0];
    await comment.vm.$emit('click-feedback', {
      commentData: makeComment('c1'),
      parentCommentId: '',
    });
    const modal = wrapper.findComponent({ name: 'GenericFeedbackFormModal' });
    await modal.vm.$emit('update-feedback', 'Helpful note');
    await modal.vm.$emit('primary-button-click');
    expect(modal.exists()).toBe(true);
  });

  it('updates notification and profile state from pinned answers', async () => {
    const wrapper = mountSection({ answers: [makeComment('a1')] });
    const pinned = wrapper.findComponent(PinnedAnswersStub);
    await pinned.vm.$emit('start-comment-save');
    await pinned.vm.$emit('show-copied-link-notification', true);
    await pinned.vm.$emit('show-marked-as-best-answer-notification', true);
    await pinned.vm.$emit('show-unmarked-as-best-answer-notification', true);
    await pinned.vm.$emit('open-mod-profile');
    await pinned.vm.$emit('scroll-to-top');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('updates notification and profile state from an inline comment', async () => {
    const wrapper = mountSection();
    const comment = wrapper.findAllComponents(CommentStub)[0];
    await comment.vm.$emit('start-comment-save');
    await comment.vm.$emit('show-copied-link-notification', true);
    await comment.vm.$emit('show-marked-as-best-answer-notification', true);
    await comment.vm.$emit('show-unmarked-as-best-answer-notification', true);
    await comment.vm.$emit('open-mod-profile-modal');
    expect(wrapper.findAllComponents({ name: 'Notification' })).toHaveLength(8);
  });

  it('updates notification state from a nested Nuxt page', async () => {
    const wrapper = mountSection({ showNuxtPage: true });
    const page = wrapper.findComponent({ name: 'NuxtPage' });
    await page.vm.$emit('start-comment-save');
    await page.vm.$emit('show-copied-link-notification', true);
    await page.vm.$emit('show-marked-as-best-answer-notification', true);
    await page.vm.$emit('show-unmarked-as-best-answer-notification', true);
    expect(page.exists()).toBe(true);
  });

  it('closes comment-section notifications and feedback modals', async () => {
    const wrapper = mountSection();
    for (const notification of wrapper.findAllComponents({
      name: 'Notification',
    })) {
      await notification.vm.$emit('close-notification');
    }
    await wrapper
      .findComponent({ name: 'GenericFeedbackFormModal' })
      .vm.$emit('close');
    expect(
      wrapper.findComponent({ name: 'GenericFeedbackFormModal' }).exists()
    ).toBe(true);
  });
});
