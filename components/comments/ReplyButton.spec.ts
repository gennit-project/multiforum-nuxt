import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { makeComment } from '@/tests/utils/factories';

import ReplyButton from '@/components/comments/ReplyButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(ReplyButton, {
    props: { commentData: makeComment(), ...props },
  });

describe('ReplyButton', () => {
  it('renders the reply button for an authenticated user', () => {
    const wrapper = mountButton();
    expect(
      wrapper.find('[data-testid="reply-comment-button"]').exists()
    ).toBe(true);
  });

  it('emits toggleShowReplyEditor when clicked', async () => {
    const wrapper = mountButton();
    await wrapper.get('[data-testid="reply-comment-button"]').trigger('click');
    expect(wrapper.emitted('toggleShowReplyEditor')).toHaveLength(1);
  });

  it('applies the best-answer styling when marked as answer', () => {
    const wrapper = mountButton({ isMarkedAsAnswer: true });
    expect(
      wrapper.get('[data-testid="reply-comment-button"]').classes().join(' ')
    ).toContain('bg-green-100');
  });
});
