import { describe, expect, it } from 'vitest';

import TooltipContent from '@/components/TooltipContent.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountTooltip = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(TooltipContent, {
    props,
  });

describe('TooltipContent', () => {
  it('renders the tooltip text', () => {
    const wrapper = mountTooltip({ tooltipText: 'Helpful explanation' });

    expect(wrapper.text()).toContain('Helpful explanation');
  });

  it('renders the unicode block when tooltipUnicode is provided', () => {
    const wrapper = mountTooltip({
      tooltipUnicode: '🎯',
      tooltipText: 'Helpful explanation',
    });

    expect(wrapper.text()).toContain('🎯');
  });

  it('omits the unicode block when tooltipUnicode is blank', () => {
    const wrapper = mountTooltip({ tooltipUnicode: '', tooltipText: 'Helpful explanation' });

    expect(wrapper.find('.text-6xl').exists()).toBe(false);
  });
});
