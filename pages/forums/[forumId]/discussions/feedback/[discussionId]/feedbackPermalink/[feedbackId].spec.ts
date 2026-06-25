import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import CommentOnFeedbackPage from '@/components/comments/CommentOnFeedbackPage.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'comment-1' } }),
}));

// Render the #comment slot with stub comment data so we can assert the
// feedback comment is wired up.
const PermalinkedFeedbackCommentStub = defineComponent({
  name: 'PermalinkedFeedbackComment',
  props: ['commentId'],
  setup(_props, { slots }) {
    return () => h('div', slots.comment?.({ commentData: { id: 'comment-1' } }));
  },
});

describe('discussion feedback permalink page', () => {
  it('passes the route comment id to the permalinked feedback comment', async () => {
    const Page = (await import('./[feedbackId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        stubs: { PermalinkedFeedbackComment: PermalinkedFeedbackCommentStub },
      },
    });
    expect(
      wrapper.findComponent(PermalinkedFeedbackCommentStub).props('commentId')
    ).toBe('comment-1');
  });

  it('highlights the rendered feedback comment', async () => {
    const Page = (await import('./[feedbackId].vue')).default;
    const wrapper = shallowMount(Page, {
      global: {
        stubs: { PermalinkedFeedbackComment: PermalinkedFeedbackCommentStub },
      },
    });
    expect(
      wrapper.findComponent(CommentOnFeedbackPage).props('isHighlighted')
    ).toBe(true);
  });
});
