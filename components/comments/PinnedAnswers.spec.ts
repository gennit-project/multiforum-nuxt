import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PinnedAnswers from '@/components/comments/PinnedAnswers.vue';
import type { Comment as CommentType } from '@/__generated__/graphql';

const answer = (id: string) => ({ id }) as unknown as CommentType;

// [child event emitted by Comment, parent event re-emitted by PinnedAnswers]
const REEMIT_TABLE: [string, string][] = [
  ['create-comment', 'createComment'],
  ['delete-comment', 'delete-comment'],
  ['click-edit-comment', 'click-edit-comment'],
  ['open-edit-comment-editor', 'openEditCommentEditor'],
  ['update-edit-comment-input', 'updateEditCommentInput'],
  ['update-create-reply-comment-input', 'updateCreateReplyCommentInput'],
  ['show-copied-link-notification', 'showCopiedLinkNotification'],
  ['show-marked-as-best-answer-notification', 'showMarkedAsBestAnswerNotification'],
  ['show-unmarked-as-best-answer-notification', 'showUnmarkedAsBestAnswerNotification'],
  ['click-report', 'clickReport'],
  ['click-feedback', 'clickFeedback'],
  ['click-undo-feedback', 'clickUndoFeedback'],
  ['click-edit-feedback', 'clickEditFeedback'],
  ['handle-view-feedback', 'handleViewFeedback'],
  ['start-comment-save', 'startCommentSave'],
  ['open-reply-editor', 'openReplyEditor'],
  ['hide-reply-editor', 'hideReplyEditor'],
  ['hide-edit-comment-editor', 'hideEditCommentEditor'],
  ['save-edit', 'saveEdit'],
  ['open-mod-profile', 'openModProfile'],
  ['scroll-to-top', 'scrollToTop'],
  ['handle-click-archive', 'handleClickArchive'],
  ['handle-click-archive-and-suspend', 'handleClickArchiveAndSuspend'],
  ['handle-click-unarchive', 'handleClickUnarchive'],
];

const commentStub = {
  name: 'Comment',
  props: ['commentData', 'locked', 'enableFeedback', 'originalPoster'],
  emits: REEMIT_TABLE.map(([child]) => child),
  template: '<div class="comment" />',
};

const mountAnswers = (props: Record<string, unknown> = {}) =>
  mount(PinnedAnswers, {
    props: { answers: [answer('a1')], ...props },
    global: { stubs: { Comment: commentStub } },
  });

describe('PinnedAnswers visibility', () => {
  it('renders nothing without answers', () => {
    const wrapper = mountAnswers({ answers: [] });

    expect(wrapper.text()).toBe('');
  });

  it('renders a Comment for each answer', () => {
    const wrapper = mountAnswers({ answers: [answer('a1'), answer('a2')] });

    expect(wrapper.findAllComponents(commentStub)).toHaveLength(2);
  });
});

describe('PinnedAnswers heading', () => {
  it('uses the singular heading for one answer', () => {
    const wrapper = mountAnswers();

    expect(wrapper.text()).toContain('Best Answer');
  });

  it('uses singular copy for one answer', () => {
    const wrapper = mountAnswers();

    expect(wrapper.text()).toContain('This answer was');
  });

  it('uses the plural heading for multiple answers', () => {
    const wrapper = mountAnswers({ answers: [answer('a1'), answer('a2')] });

    expect(wrapper.text()).toContain('Best Answers');
  });

  it('uses plural copy for multiple answers', () => {
    const wrapper = mountAnswers({ answers: [answer('a1'), answer('a2')] });

    expect(wrapper.text()).toContain('These answers were');
  });
});

describe('PinnedAnswers props and emits', () => {
  it('locks the comment when the discussion is archived', () => {
    const wrapper = mountAnswers({ archived: true });

    expect(wrapper.getComponent(commentStub).props('locked')).toBe(true);
  });

  it.each(REEMIT_TABLE)(
    're-emits %s as %s',
    async (childEvent, parentEvent) => {
      const wrapper = mountAnswers();

      await wrapper.getComponent(commentStub).vm.$emit(childEvent, 'payload');

      expect(wrapper.emitted(parentEvent)).toBeTruthy();
    }
  );
});
