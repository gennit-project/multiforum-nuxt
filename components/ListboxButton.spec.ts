import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import AppListboxButton from '@/components/ListboxButton.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

vi.mock('@headlessui/vue', () => ({
  ListboxButton: defineComponent({
    name: 'ListboxButton',
    template: '<button class="listbox-button-stub"><slot /></button>',
  }),
}));

const selectorIconStub = defineComponent({
  name: 'SelectorIcon',
  template: '<div class="selector-icon-stub" />',
});

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(AppListboxButton, {
    props: {
      label: 'Select a forum',
      ...props,
    },
    global: {
      stubs: {
        SelectorIcon: selectorIconStub,
      },
    },
  });

describe('ListboxButton', () => {
  it('renders the provided label', () => {
    const wrapper = mountButton();

    expect(wrapper.text()).toContain('Select a forum');
  });

  it('renders the selector icon', () => {
    const wrapper = mountButton();

    expect(wrapper.find('.selector-icon-stub').exists()).toBe(true);
  });

  it('applies the listbox trigger styling classes', () => {
    const wrapper = mountButton();

    expect(wrapper.get('.listbox-button-stub').classes()).toContain('border-gray-300');
    expect(wrapper.get('.listbox-button-stub').classes()).toContain('focus:ring-orange-500');
  });
});
