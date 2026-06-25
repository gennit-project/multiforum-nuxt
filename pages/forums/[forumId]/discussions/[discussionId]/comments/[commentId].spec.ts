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
  it('passes the route comment id to the permalinked comment', async () => {
    const wrapper = await mountPage(baseProps);
    expect(wrapper.findComponent(PermalinkedStub).props('commentId')).toBe(
      'comment-1'
    );
  });

  it('renders the permalinked comment as highlighted', async () => {
    const wrapper = await mountPage(baseProps);
    expect(wrapper.findComponent(Comment).props('isPermalinked')).toBe(true);
  });

  it('forwards the enableFeedback prop to the comment', async () => {
    const wrapper = await mountPage({ ...baseProps, enableFeedback: true });
    expect(wrapper.findComponent(Comment).props('enableFeedback')).toBe(true);
  });
});
