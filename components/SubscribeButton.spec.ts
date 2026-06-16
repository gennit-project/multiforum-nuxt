import { describe, it, expect, vi } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import { createSSRAuthMock } from '@/tests/utils/mockSSRAuth';

import SubscribeButton from '@/components/SubscribeButton.vue';

// RequireAuth (stubbed at render by the harness) imports useSSRAuth, which
// pulls nuxt/app at load — mock it so the component imports cleanly.
vi.mock('@/composables/useSSRAuth', () => createSSRAuthMock());

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(SubscribeButton, {
    props: { isSubscribed: false, ...props },
    global: { stubs: { LoadingSpinner: true } },
  });

describe('SubscribeButton', () => {
  it('labels the button "Subscribe" when not subscribed', () => {
    expect(mountButton({ isSubscribed: false }).text()).toContain('Subscribe');
  });

  it('labels the button "Unsubscribe" when subscribed', () => {
    expect(mountButton({ isSubscribed: true }).text()).toContain('Unsubscribe');
  });

  it('emits toggle when clicked', async () => {
    const wrapper = mountButton();
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('does not emit toggle when disabled', async () => {
    const wrapper = mountButton({ disabled: true });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('toggle')).toBeUndefined();
  });

  it('shows a loading state instead of the button while loading', () => {
    const wrapper = mountButton({ isSubscribed: true, loading: true });
    expect(wrapper.text()).toContain('Unsubscribing...');
  });
});
