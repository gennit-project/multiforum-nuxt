import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

import AuthButton from '@/components/AuthButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AuthButton, {
    props: { testId: 'auth-btn', ...props },
    slots: { default: 'Do it' },
    global: { stubs: { ButtonContent: true } },
  });

describe('AuthButton', () => {
  it('renders the button with the given test id for an authenticated user', () => {
    const wrapper = mountButton();
    expect(wrapper.find('[data-testid="auth-btn"]').exists()).toBe(true);
  });

  it('emits click when the authenticated button is clicked', async () => {
    const wrapper = mountButton();
    await wrapper.get('[data-testid="auth-btn"]').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
