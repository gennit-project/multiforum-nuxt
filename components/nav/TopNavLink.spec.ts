import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import TopNavLink from './TopNavLink.vue';

const mountLink = (slot = '') =>
  mountWithDefaults(TopNavLink, {
    props: { to: '/forums', label: 'Forums' },
    slots: slot ? { default: slot } : {},
  });

describe('TopNavLink', () => {
  it('renders the label', () => {
    expect(mountLink().text()).toContain('Forums');
  });

  it('links to the target route', () => {
    expect(mountLink().find('a').attributes('href')).toBe('/forums');
  });

  it('renders the default slot content', () => {
    expect(mountLink('<span class="icon">icon</span>').find('.icon').exists()).toBe(
      true
    );
  });
});
