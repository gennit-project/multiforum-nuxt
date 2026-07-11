import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import HamburgerMenuButton from '@/components/nav/HamburgerMenuButton.vue';

describe('HamburgerMenuButton', () => {
  it('has an accessible name for the icon-only control', () => {
    const wrapper = mount(HamburgerMenuButton);

    expect(wrapper.get('button').text()).toContain('navigation menu');
  });

  it('reports collapsed state by default', () => {
    const wrapper = mount(HamburgerMenuButton);

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('reflects the expanded prop in aria-expanded', () => {
    const wrapper = mount(HamburgerMenuButton, { props: { expanded: true } });

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
  });

  it('points aria-controls at the mobile menu region', () => {
    const wrapper = mount(HamburgerMenuButton);

    expect(wrapper.get('button').attributes('aria-controls')).toBe('mobile-menu');
  });
});
