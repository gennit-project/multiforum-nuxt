import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import FloatingDropdown from '@/components/FloatingDropdown.vue';

vi.mock('@/composables/useTheme', () => ({ useAppTheme: () => ({ theme: ref('light') }) }));

const mountDropdown = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(FloatingDropdown, {
    props,
    slots: { button: '<button class="trigger" />', content: '<div class="panel" />', ...slots },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        'v-menu': {
          name: 'VMenu',
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<div><slot name="activator" :props="{}" /><slot /></div>',
        },
        'v-card': { template: '<div><slot /></div>' },
      },
    },
  });

describe('FloatingDropdown', () => {
  it('renders the button slot', () => {
    const wrapper = mountDropdown();

    expect(wrapper.find('.trigger').exists()).toBe(true);
  });

  it('renders the content slot', () => {
    const wrapper = mountDropdown();

    expect(wrapper.find('.panel').exists()).toBe(true);
  });

  it('re-emits update:modelValue from the menu', async () => {
    const wrapper = mountDropdown({ modelValue: true });

    await wrapper.getComponent({ name: 'VMenu' }).vm.$emit('update:modelValue', false);

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
  });

  it('passes the model value to the menu', () => {
    const wrapper = mountDropdown({ modelValue: true });

    expect(wrapper.getComponent({ name: 'VMenu' }).props('modelValue')).toBe(true);
  });
});
