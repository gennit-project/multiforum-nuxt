import { describe, it, expect, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import PermalinkedFeedbackComment from '@/components/comments/PermalinkedFeedbackComment.vue';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'c1' } }),
}));

describe('comment feedback permalink page', () => {
  it('passes the route comment id to the permalinked feedback comment', async () => {
    const Page = (await import('./[feedbackId].vue')).default;
    const wrapper = shallowMount(Page);
    expect(
      wrapper.findComponent(PermalinkedFeedbackComment).attributes('comment-id')
    ).toBe('c1');
  });
});
