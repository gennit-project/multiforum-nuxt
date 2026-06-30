import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('nuxt/app', () => ({
  useRoute: () => ({ params: { commentId: 'c1' } }),
}));

describe('comment feedback permalink page', () => {
  it('passes the route comment id to the permalinked feedback comment', async () => {
    const Page = (await import('./[feedbackId].vue')).default;
    const wrapper = mount(Page, {
      global: {
        stubs: {
          PermalinkedFeedbackComment: {
            name: 'PermalinkedFeedbackComment',
            props: ['commentId'],
            template: '<div class="permalink" :data-comment-id="commentId"><slot name="comment" :comment-data="{ id: \'c1\' }" /></div>',
          },
          CommentOnFeedbackPage: {
            name: 'CommentOnFeedbackPage',
            props: ['comment', 'isHighlighted'],
            emits: ['show-copied-link-notification', 'click-feedback', 'click-undo-feedback', 'click-edit-feedback'],
            template: '<button class="feedback-comment" @click="$emit(\'click-feedback\')" />',
          },
        },
      },
    });

    expect(wrapper.get('.permalink').attributes('data-comment-id')).toBe('c1');
  });

  it('re-emits feedback events from the rendered comment component', async () => {
    const Page = (await import('./[feedbackId].vue')).default;
    const wrapper = mount(Page, {
      global: {
        stubs: {
          PermalinkedFeedbackComment: {
            name: 'PermalinkedFeedbackComment',
            props: ['commentId'],
            template: '<div><slot name="comment" :comment-data="{ id: \'c1\' }" /></div>',
          },
          CommentOnFeedbackPage: {
            name: 'CommentOnFeedbackPage',
            props: ['comment', 'isHighlighted'],
            emits: ['show-copied-link-notification', 'click-feedback', 'click-undo-feedback', 'click-edit-feedback'],
            template:
              '<div><button class="copy" @click="$emit(\'show-copied-link-notification\')" /><button class="feedback" @click="$emit(\'click-feedback\')" /></div>',
          },
        },
      },
    });

    await wrapper.get('.copy').trigger('click');
    await wrapper.get('.feedback').trigger('click');

    expect({
      copied: wrapper.emitted('showCopiedLinkNotification')?.length,
      feedback: wrapper.emitted('clickFeedback')?.length,
    }).toEqual({
      copied: 1,
      feedback: 1,
    });
  });
});
