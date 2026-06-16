import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

import PlaceholderAvatar from '@/components/PlaceholderAvatar.vue';

const mountAvatar = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(PlaceholderAvatar, { props });

describe('PlaceholderAvatar', () => {
  it('applies the medium size classes by default', () => {
    const wrapper = mountAvatar();
    expect(wrapper.classes()).toContain('h-10');
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
  ])('applies the %s size class', (size, expectedClass) => {
    const wrapper = mountAvatar({ size });
    expect(wrapper.classes()).toContain(expectedClass);
  });

  it('renders the user icon', () => {
    const wrapper = mountAvatar();
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
