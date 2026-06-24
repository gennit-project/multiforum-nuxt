import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import IconTooltip from '@/components/common/IconTooltip.vue';

const mountTooltip = (props: Record<string, unknown> = {}, slot = '<i class="icon" />') =>
  mount(IconTooltip, {
    props: { text: 'Helpful hint', ...props },
    slots: { default: slot },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        teleport: true,
        transition: true,
      },
    },
  });

const trigger = (w: ReturnType<typeof mount>) =>
  w.find('div[class="relative inline-block"] > div');

describe('IconTooltip', () => {
  it('renders the trigger slot', () => {
    const wrapper = mountTooltip();

    expect(wrapper.find('.icon').exists()).toBe(true);
  });

  it('is hidden by default', () => {
    const wrapper = mountTooltip();

    expect(wrapper.text()).not.toContain('Helpful hint');
  });

  it('shows the tooltip on mouse enter', async () => {
    const wrapper = mountTooltip();

    await trigger(wrapper).trigger('mouseenter');

    expect(wrapper.text()).toContain('Helpful hint');
  });

  it('hides the tooltip on mouse leave', async () => {
    const wrapper = mountTooltip();
    await trigger(wrapper).trigger('mouseenter');

    await trigger(wrapper).trigger('mouseleave');

    expect(wrapper.text()).not.toContain('Helpful hint');
  });

  it('shows the tooltip on focus', async () => {
    const wrapper = mountTooltip();

    await trigger(wrapper).trigger('focus');

    expect(wrapper.text()).toContain('Helpful hint');
  });
});
