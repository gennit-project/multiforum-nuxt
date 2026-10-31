import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import Comment from '@/components/comments/Comment.vue';
import { makePermalinkedComment } from '@/tests/utils/permalinkFixtures';
const selectedComment = makePermalinkedComment();

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'comment-1' } }),
}));

const PermalinkedStub = defineComponent({
  name: 'PermalinkedComment',
  setup(_props, { slots }) {
    return () => h('div', slots.comment?.({ commentData: selectedComment }));
  },
});

const mountPage = async (props: Record<string, unknown>) => {
  const Page = (await import('./[commentId].vue')).default;
  return shallowMount(Page, {
    props,
    global: { stubs: { PermalinkedComment: PermalinkedStub } },
  });
};

const baseProps = {
  aggregateCommentCount: 1,
  enableFeedback: true,
  locked: false,
  loggedInUserModName: 'mod-1',
  replyFormOpenAtCommentID: '',
  originalPoster: 'alice',
};

describe('discussion comment permalink page', () => {
  it('passes the exact selected slot payload to the renderer', async () => {
    const wrapper = await mountPage(baseProps);
    expect({
      data: wrapper.findComponent(Comment).props('commentData'),
      undeclaredId:
        wrapper.findComponent(PermalinkedStub).vm.$attrs['comment-id'],
    }).toEqual({ data: selectedComment, undeclaredId: undefined });
  });

  it('renders the permalinked comment as highlighted', async () => {
    const wrapper = await mountPage(baseProps);
    expect(wrapper.findComponent(Comment).props('isPermalinked')).toBe(true);
  });

  it('forwards the enableFeedback prop to the comment', async () => {
    const wrapper = await mountPage({ ...baseProps, enableFeedback: true });
    expect(wrapper.findComponent(Comment).props('enableFeedback')).toBe(true);
  });

  it.each([
    'startCommentSave',
    'openReplyEditor',
    'hideReplyEditor',
    'openEditCommentEditor',
    'hideEditCommentEditor',
    'clickEditComment',
    'deleteComment',
    'createComment',
    'updateCreateReplyCommentInput',
    'updateEditCommentInput',
    'saveEdit',
    'clickReport',
    'clickFeedback',
    'clickUndoFeedback',
    'clickEditFeedback',
    'updateFeedback',
    'handleViewFeedback',
    'showCopiedLinkNotification',
  ])('forwards the %s event', async (eventName) => {
    const wrapper = await mountPage(baseProps);
    wrapper.findComponent(Comment).vm.$emit(eventName, 'payload');

    expect(wrapper.emitted(eventName)?.[0]).toEqual(['payload']);
  });

  it('forwards scrollToTop without adding a payload', async () => {
    const wrapper = await mountPage(baseProps);
    wrapper.findComponent(Comment).vm.$emit('scrollToTop', 'ignored');

    expect(wrapper.emitted('scrollToTop')?.[0]).toEqual([]);
  });
});
