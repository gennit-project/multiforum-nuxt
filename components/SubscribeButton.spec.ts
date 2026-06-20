import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import SubscribeButton from '@/components/SubscribeButton.vue';

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
