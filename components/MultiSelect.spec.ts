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

  it('renders disabled option descriptions and does not emit when clicked', async () => {
    const wrapper = mountSelect({
      options: [
        { value: 'a', label: 'Apple' },
        {
          value: 'b',
          label: 'Banana',
          disabled: true,
          description: 'Does not allow events',
        },
      ],
      modelValue: [],
    });

    await wrapper.get('[data-testid="ms"]').trigger('click');
    expect(wrapper.text()).toContain('Does not allow events');

    await clickRow(wrapper, 'Banana');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  const clickRow = async (wrapper: ReturnType<typeof mountSelect>, label: string) => {
    const row = wrapper
      .findAll('[class*="cursor-pointer"]')
      .find((r) => r.text().includes(label));
    (row!.element as HTMLElement).click();
    await wrapper.vm.$nextTick();
  };

  describe('single-select mode', () => {
    it('replaces the selection instead of accumulating', async () => {
      const wrapper = mountSelect({ multiple: false, modelValue: ['a'] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await clickRow(wrapper, 'Banana');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b']]);
    });

    it('closes the dropdown after a single selection', async () => {
      const wrapper = mountSelect({ multiple: false, modelValue: [] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      expect(wrapper.text()).toContain('Cherry');
      await clickRow(wrapper, 'Apple');
      expect(wrapper.text()).not.toContain('Cherry');
    });
  });

  describe('sections', () => {
    const sections = [
      {
        title: 'Fruits',
        selectAllLabel: 'All fruits',
        options: [
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
        ],
      },
    ];
    const mountSections = (props: Record<string, unknown> = {}) =>
      mountWithDefaults(MultiSelect, {
        props: { options: [], sections, multiple: true, testId: 'ms', ...props },
      });

    it('renders the section title and a select-all row', async () => {
      const wrapper = mountSections({ modelValue: [] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      expect(wrapper.text()).toContain('Fruits');
      expect(wrapper.text()).toContain('All fruits');
    });

    it('select-all selects every option in the section', async () => {
      const wrapper = mountSections({ modelValue: [] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await wrapper.get('input[aria-label="All fruits"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'b']]);
    });

    it('select-all deselects when the section is already fully selected', async () => {
      const wrapper = mountSections({ modelValue: ['a', 'b'] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      const selectAll = wrapper.get('input[aria-label="All fruits"]');
      expect((selectAll.element as HTMLInputElement).checked).toBe(true);
      await selectAll.trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
    });

    it('select-all skips disabled options in the section', async () => {
      const wrapper = mountWithDefaults(MultiSelect, {
        props: {
          options: [],
          sections: [
            {
              title: 'Fruits',
              selectAllLabel: 'All fruits',
              options: [
                { value: 'a', label: 'Apple' },
                {
                  value: 'b',
                  label: 'Banana',
                  disabled: true,
                  description: 'Does not allow events',
                },
              ],
            },
          ],
          multiple: true,
          testId: 'ms',
          modelValue: [],
        },
      });

      await wrapper.get('[data-testid="ms"]').trigger('click');
      await wrapper.get('input[aria-label="All fruits"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a']]);
    });
  });

  describe('search', () => {
    it('emits the search query when typing in the search box', async () => {
      const wrapper = mountWithDefaults(MultiSelect, {
        props: {
          options: [],
          sections: [
            {
              title: 'Fruits',
              options: [
                { value: 'a', label: 'Apple' },
                { value: 'b', label: 'Banana' },
              ],
            },
          ],
          searchable: true,
          searchPlaceholder: 'Search fruits',
          multiple: true,
          testId: 'ms',
          modelValue: [],
        },
      });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await wrapper.get('input[placeholder="Search fruits"]').setValue('Apple');
      expect(wrapper.emitted('search')?.at(-1)).toEqual(['Apple']);
    });
  });
});
