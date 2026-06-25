import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import IssueSubscriptionPanel from './IssueSubscriptionPanel.vue';
import GenericButton from '@/components/GenericButton.vue';

const mountPanel = (props: Record<string, unknown> = {}) =>
  shallowMount(IssueSubscriptionPanel, { props });

describe('IssueSubscriptionPanel', () => {
  it('labels the toggle "Subscribe" when not subscribed', () => {
    const wrapper = mountPanel({ isSubscribed: false });
    expect(wrapper.findComponent(GenericButton).props('text')).toBe('Subscribe');
  });

  it('labels the toggle "Unsubscribe" when subscribed', () => {
    const wrapper = mountPanel({ isSubscribed: true });
    expect(wrapper.findComponent(GenericButton).props('text')).toBe(
      'Unsubscribe'
    );
  });

  it('emits toggle when the subscribe button is clicked', () => {
    const wrapper = mountPanel({ isSubscribed: false });
    wrapper.findComponent(GenericButton).vm.$emit('click');
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });

  it('shows the call-to-action when showCta is set and not subscribed', () => {
    const wrapper = mountPanel({ isSubscribed: false, showCta: true });
    expect(wrapper.text()).toContain('Subscribe to updates on this issue?');
  });

  it('hides the call-to-action once subscribed', () => {
    const wrapper = mountPanel({ isSubscribed: true, showCta: true });
    expect(wrapper.text()).not.toContain('Subscribe to updates on this issue?');
  });

  it('emits dismiss-cta from the "Not now" button', () => {
    const wrapper = mountPanel({ isSubscribed: false, showCta: true });
    // The CTA's "Not now" is the second GenericButton in the panel.
    const buttons = wrapper.findAllComponents(GenericButton);
    buttons[buttons.length - 1].vm.$emit('click');
    expect(wrapper.emitted('dismiss-cta')).toHaveLength(1);
  });
});
