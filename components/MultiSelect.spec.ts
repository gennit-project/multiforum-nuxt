import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import MultiSelect from '@/components/MultiSelect.vue';

const options = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
];

const mountSelect = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(MultiSelect, {
    props: { options, multiple: true, testId: 'ms', ...props },
  });

describe('MultiSelect', () => {
  it('shows the placeholder when nothing is selected', () => {
    const wrapper = mountSelect({ modelValue: [], placeholder: 'Pick some' });
    expect(wrapper.text()).toContain('Pick some');
  });

  it('renders a chip for each selected value', () => {
    const wrapper = mountSelect({ modelValue: ['a', 'b'] });
    const chips = wrapper.findAll('span.font-mono').map((s) => s.text());
    expect(chips).toEqual(['a', 'b']);
  });

  it('emits an empty selection when cleared', async () => {
    const wrapper = mountSelect({ modelValue: ['a'] });
    await wrapper.get('button[aria-label="Clear selection"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
  });

  it('emits the remaining values when a chip is removed', async () => {
    const wrapper = mountSelect({ modelValue: ['a', 'b'] });
    const removeButtons = wrapper
      .findAll('span')
      .filter((s) => s.text() === '×');
    await removeButtons[0]!.trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b']]);
  });

  it('renders the options once the dropdown is opened', async () => {
    const wrapper = mountSelect({ modelValue: [] });
    expect(wrapper.text()).not.toContain('Apple');
    await wrapper.get('[data-testid="ms"]').trigger('click');
    expect(wrapper.text()).toContain('Apple');
  });

  it('toggles an option via its checkbox row when opened', async () => {
    const wrapper = mountSelect({ modelValue: [] });
    await wrapper.get('[data-testid="ms"]').trigger('click');
    // The row (not the stop-propagating checkbox) carries the click handler.
    const checkbox = wrapper.get('input[aria-label="Select Apple"]');
    const row = checkbox.element.closest(
      '[class*="cursor-pointer"]'
    ) as HTMLElement;
    row.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a']]);
  });
});
