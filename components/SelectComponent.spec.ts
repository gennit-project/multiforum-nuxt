import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import SelectComponent from '@/components/SelectComponent.vue';

// The global setup mocks @headlessui/vue with only the Tab components, so
// re-mock the Listbox primitives this select uses.
vi.mock('@headlessui/vue', () => ({
  Listbox: {
    name: 'Listbox',
    emits: ['update:modelValue'],
    template: '<div><slot /></div>',
  },
  ListboxOptions: { name: 'ListboxOptions', template: '<ul><slot /></ul>' },
  ListboxOption: {
    name: 'ListboxOption',
    props: ['value'],
    template: '<div class="lb-option"><slot :active="false" :selected="false" /></div>',
  },
}));

const options = [
  { label: 'Newest', value: 'new' },
  { label: 'Oldest', value: 'old' },
];

const mountSelect = (props: Record<string, unknown> = {}) =>
  mount(SelectComponent, {
    props: { label: 'Sort', options, ...props },
    global: {
      stubs: {
        ListboxButton: { name: 'ListboxButton', props: ['label'], template: '<button>{{ label }}</button>' },
        CheckIcon: true,
      },
    },
  });

describe('SelectComponent', () => {
  it('renders the option labels', () => {
    const wrapper = mountSelect();

    expect(wrapper.text()).toContain('Newest');
  });

  it('shows the label on the button', () => {
    const wrapper = mountSelect();

    expect(wrapper.get('button').text()).toBe('Sort');
  });

  it('renders an option per item', () => {
    const wrapper = mountSelect();

    expect(wrapper.findAll('.lb-option')).toHaveLength(2);
  });

  it('emits selected when the listbox value changes', async () => {
    const wrapper = mountSelect();

    await wrapper.getComponent({ name: 'Listbox' }).vm.$emit('update:modelValue', options[1]);

    expect(wrapper.emitted('selected')?.[0]).toEqual([options[1]]);
  });
});
