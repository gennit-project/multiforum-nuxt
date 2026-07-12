import { describe, expect, it, vi } from 'vitest';

import SiteLogo from '@/components/nav/SiteLogo.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

vi.mock('@/config', () => ({
  config: { serverDisplayName: 'Test Forum' },
}));

describe('SiteLogo', () => {
  it('renders both mobile and desktop logo images', () => {
    const wrapper = mountWithDefaults(SiteLogo);

    expect(wrapper.findAll('img')).toHaveLength(2);
  });

  it('names both logos after the server for assistive tech', () => {
    const wrapper = mountWithDefaults(SiteLogo);

    expect(
      wrapper.findAll('img').every((img) => img.attributes('alt') === 'Test Forum logo')
    ).toBe(true);
  });

  it('applies the responsive visibility classes to the two logos', () => {
    const wrapper = mountWithDefaults(SiteLogo);
    const [mobileLogo, desktopLogo] = wrapper.findAll('img');

    expect(mobileLogo.classes()).toContain('lg:hidden');
    expect(desktopLogo.classes()).toContain('lg:block');
  });
});
