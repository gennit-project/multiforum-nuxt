import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import FloatingDropdown from '@/components/FloatingDropdown.vue';

// @floating-ui/vue's useFloating + autoUpdate loops under jsdom; stub it.
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

const mountDropdown = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(FloatingDropdown, {
    props,
    slots: {
      button:
        '<template #button="{ activatorProps }"><button class="trigger" v-bind="activatorProps" /></template>',
      content: '<div class="panel" />',
      ...slots,
    },
    global: { stubs },
  });

describe('FloatingDropdown', () => {
  it('renders the button slot', () => {
    const wrapper = mountDropdown();

    expect(wrapper.find('.trigger').exists()).toBe(true);
  });

  it('does not render the content while closed', () => {
    const wrapper = mountDropdown({ modelValue: false });

    expect(wrapper.find('.panel').exists()).toBe(false);
  });

  it('renders the content slot when open', () => {
    const wrapper = mountDropdown({ modelValue: true });

    expect(wrapper.find('.panel').exists()).toBe(true);
  });

  it('emits update:modelValue when the trigger is activated', async () => {
    const wrapper = mountDropdown({ modelValue: false });

    await wrapper.find('.trigger').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  });
});
