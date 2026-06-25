import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import Comment from '@/components/comments/Comment.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'comment-1' } }),
}));

const PermalinkedStub = defineComponent({
  name: 'PermalinkedComment',
  props: ['commentId'],
  setup(_props, { slots }) {
    return () => h('div', slots.comment?.({ commentData: { id: 'comment-1' } }));
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
  it('passes the route comment id to the permalinked comment', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(PermalinkedStub).props('commentId')).toBe(
      'comment-1'
    );
  });

  it('disables feedback for event comments', async () => {
    const wrapper = await mountPage();
    expect(wrapper.findComponent(Comment).props('enableFeedback')).toBe(false);
  });
});
