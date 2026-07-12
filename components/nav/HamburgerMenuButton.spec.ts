import { describe, expect, it } from 'vitest';

import HamburgerMenuButton from '@/components/nav/HamburgerMenuButton.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

describe('HamburgerMenuButton', () => {
  it('renders the mobile-menu control attributes', () => {
    const wrapper = mountWithDefaults(HamburgerMenuButton);

    expect(wrapper.get('button').attributes('aria-controls')).toBe('mobile-menu');
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false');
  });

  it('reflects the expanded prop in aria-expanded', () => {
    const wrapper = mountWithDefaults(HamburgerMenuButton, {
      props: { expanded: true },
    });

    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true');
  });

  it('includes the accessible sr-only label', () => {
    const wrapper = mountWithDefaults(HamburgerMenuButton);

    expect(wrapper.text()).toContain('Open site-wide navigation menu');
  });

  it('renders both the open and close menu icons', () => {
    const wrapper = mountWithDefaults(HamburgerMenuButton);

    expect(wrapper.findAll('svg')).toHaveLength(2);
  });
});
