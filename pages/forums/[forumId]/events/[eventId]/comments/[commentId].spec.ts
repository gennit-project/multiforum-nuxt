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

const mountPage = async () => {
  const Page = (await import('./[commentId].vue')).default;
  return shallowMount(Page, {
    props: {
      aggregateCommentCount: 1,
      locked: false,
      loggedInUserModName: 'mod-1',
      replyFormOpenAtCommentID: '',
    },
    global: { stubs: { PermalinkedComment: PermalinkedStub } },
  });
};

describe('event comment permalink page', () => {
  it('passes the exact selected slot payload to the renderer', async () => {
    const wrapper = await mountPage();
    expect({
      data: wrapper.findComponent(Comment).props('commentData'),
      undeclaredId:
        wrapper.findComponent(PermalinkedStub).vm.$attrs['comment-id'],
    }).toEqual({ data: selectedComment, undeclaredId: undefined });
  });

  it('disables feedback for event comments', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(Comment).props('enableFeedback')).toBe(false);
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
    'scrollToTop',
    'clickReport',
  ])('forwards the %s event', async (eventName) => {
    const wrapper = await mountPage();
    wrapper.findComponent(Comment).vm.$emit(eventName, 'payload');

    expect(wrapper.emitted(eventName)?.[0]).toEqual(['payload']);
  });
});
