import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import Tooltip from '@/components/Tooltip.vue';

vi.mock('@floating-ui/vue', () => ({
  useFloating: () => ({ floatingStyles: ref({}) }),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  autoUpdate: () => () => {},
}));

const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  Teleport: { template: '<div><slot /></div>' },
};

const mountTooltip = () =>
  mount(Tooltip, {
    props: { ariaLabel: 'More info' },
    slots: {
      activator:
        '<template #activator="{ props }"><button data-testid="trigger" v-bind="props">Hover</button></template>',
      default: 'Tooltip body',
    },
    global: { stubs },
  });

describe('Tooltip', () => {
  it('associates the trigger with the tooltip content while open', async () => {
    const wrapper = mountTooltip();
    const trigger = wrapper.get('[data-testid="trigger"]');

    expect(trigger.attributes('aria-describedby')).toBeUndefined();

    await trigger.trigger('focusin');

    const tooltip = wrapper.get('[role="tooltip"]');
    expect(trigger.attributes('aria-describedby')).toBe(tooltip.attributes('id'));
  });
});
