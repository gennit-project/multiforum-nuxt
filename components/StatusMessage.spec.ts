import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import StatusMessage from '@/components/StatusMessage.vue';

const mountStatus = (props: Record<string, unknown> = {}) =>
  mount(StatusMessage, { props, slots: { default: 'Loading...' } });

describe('StatusMessage', () => {
  it('is a polite status region by default', () => {
    const wrapper = mountStatus();

    expect(wrapper.attributes('role')).toBe('status');
  });

  it('uses aria-live polite by default', () => {
    const wrapper = mountStatus();

    expect(wrapper.attributes('aria-live')).toBe('polite');
  });

  it('becomes an assertive alert when assertive is set', () => {
    const wrapper = mountStatus({ assertive: true });

    expect(wrapper.attributes('role')).toBe('alert');
  });

  it('exposes aria-busy while busy', () => {
    const wrapper = mountStatus({ busy: true });

    expect(wrapper.attributes('aria-busy')).toBe('true');
  });

  it('omits aria-busy when not busy', () => {
    const wrapper = mountStatus();

    expect(wrapper.attributes('aria-busy')).toBeUndefined();
  });

  it('renders slotted status text', () => {
    const wrapper = mountStatus();

    expect(wrapper.text()).toContain('Loading...');
  });
});
