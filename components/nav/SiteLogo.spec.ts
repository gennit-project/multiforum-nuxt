import { describe, expect, it } from 'vitest';

import SiteLogo from '@/components/nav/SiteLogo.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

describe('SiteLogo', () => {
  it('renders both mobile and desktop logo images', () => {
    const wrapper = mountWithDefaults(SiteLogo);

    expect(wrapper.findAll('img')).toHaveLength(2);
  });

  it('uses the Workflow alt text on both logos', () => {
    const wrapper = mountWithDefaults(SiteLogo);

    expect(wrapper.findAll('img').every((img) => img.attributes('alt') === 'Workflow')).toBe(
      true
    );
  });

  it('applies the responsive visibility classes to the two logos', () => {
    const wrapper = mountWithDefaults(SiteLogo);
    const [mobileLogo, desktopLogo] = wrapper.findAll('img');

    expect(mobileLogo.classes()).toContain('lg:hidden');
    expect(desktopLogo.classes()).toContain('lg:block');
  });
});
