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

const mountAttachedSelect = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(MultiSelect, {
    attachTo: document.body,
    props: { options, multiple: true, testId: 'ms', ...props },
  });

const clickOutsideDirective = {
  beforeMount(el: HTMLElement, binding: { value: (event: Event) => void }) {
    const handler = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event);
      }
    };
    el.dataset.testClickOutsideBound = 'true';
    (el as HTMLElement & { clickOutsideEvent?: (event: Event) => void }).clickOutsideEvent =
      handler;
    document.addEventListener('click', handler);
  },
  unmounted(el: HTMLElement) {
    const handler = (
      el as HTMLElement & { clickOutsideEvent?: (event: Event) => void }
    ).clickOutsideEvent;
    if (handler) {
      document.removeEventListener('click', handler);
    }
  },
};

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

  it('keeps the dropdown open after the same click that opened it when click-outside is active', async () => {
    const wrapper = mountWithDefaults(MultiSelect, {
      attachTo: document.body,
      props: { options, multiple: true, testId: 'ms', modelValue: [] },
      global: {
        directives: {
          clickOutside: clickOutsideDirective,
          'click-outside': clickOutsideDirective,
        },
      },
    });

    expect(wrapper.text()).not.toContain('Apple');
    await wrapper.get('[data-testid="ms"]').trigger('click');

    expect(wrapper.text()).toContain('Apple');
    wrapper.unmount();
  });

  it('toggles an option via its checkbox row when opened', async () => {
    const wrapper = mountSelect({ modelValue: [] });
    await wrapper.get('[data-testid="ms"]').trigger('click');
    await clickRow(wrapper, 'Apple');
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
      .findAll('button[data-selection-control]')
      .find((r) => r.text().includes(label));
    await row!.trigger('click');
  };

  describe('keyboard accessibility', () => {
    const toggleButton = (wrapper: ReturnType<typeof mountSelect>) =>
      wrapper.get('button[aria-controls]');

    it('exposes a keyboard toggle button for the options popup', () => {
      const wrapper = mountSelect({ modelValue: [] });

      expect(toggleButton(wrapper).attributes('aria-expanded')).toBe('false');
    });

    it('opens the popup from the toggle button', async () => {
      const wrapper = mountSelect({ modelValue: [] });

      await toggleButton(wrapper).trigger('click');

      expect({
        expanded: toggleButton(wrapper).attributes('aria-expanded'),
        hasApple: wrapper.text().includes('Apple'),
      }).toEqual({ expanded: 'true', hasApple: true });
    });

    it('moves focus to the first option when a non-searchable popup opens', async () => {
      const wrapper = mountAttachedSelect({ modelValue: [] });
      await toggleButton(wrapper).trigger('click');

      expect(wrapper.get('[data-selection-control]').element).toBe(
        document.activeElement
      );
      wrapper.unmount();
    });

    it('moves focus through options with arrow keys', async () => {
      const wrapper = mountAttachedSelect({ modelValue: [] });
      await toggleButton(wrapper).trigger('click');
      await wrapper
        .get('[data-selection-control][aria-label="Apple (a)"]')
        .trigger('keydown', { key: 'ArrowDown' });

      expect((document.activeElement as HTMLElement).getAttribute('aria-label')).toBe(
        'Banana (b)'
      );
      wrapper.unmount();
    });

    it('moves focus to the final option with End', async () => {
      const wrapper = mountAttachedSelect({ modelValue: [] });
      await toggleButton(wrapper).trigger('click');
      await wrapper
        .get('[data-selection-control][aria-label="Apple (a)"]')
        .trigger('keydown', { key: 'End' });

      expect((document.activeElement as HTMLElement).getAttribute('aria-label')).toBe(
        'Cherry (c)'
      );
      wrapper.unmount();
    });

    it('toggles an option from its checkbox change event (keyboard/space)', async () => {
      const wrapper = mountAttachedSelect({ modelValue: [] });
      await toggleButton(wrapper).trigger('click');

      await wrapper.get('button[data-selection-control][aria-label="Apple (a)"]').trigger('click');

      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a']]);
    });

    it('gives each selected chip a labelled remove button', () => {
      const wrapper = mountSelect({ modelValue: ['a'] });

      expect(
        wrapper.get('button[aria-label="Remove a"]').element.tagName
      ).toBe('BUTTON');
    });

    it('closes the popup on Escape', async () => {
      const wrapper = mountSelect({ modelValue: [] });
      await toggleButton(wrapper).trigger('click');
      expect(wrapper.text()).toContain('Apple');

      await wrapper
        .get(
          `#${wrapper
            .get('button[aria-controls]')
            .attributes('aria-controls')}`
        )
        .trigger('keydown', { key: 'Escape' });

      expect(wrapper.text()).not.toContain('Apple');
    });

    it('returns focus to the toggle after Escape', async () => {
      const wrapper = mountAttachedSelect({ modelValue: [] });
      await toggleButton(wrapper).trigger('click');
      await wrapper.get('[data-selection-control]').trigger('keydown', {
        key: 'Escape',
      });

      expect(document.activeElement).toBe(toggleButton(wrapper).element);
      wrapper.unmount();
    });
  });

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
      await wrapper.get('button[data-selection-control][aria-pressed="false"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a', 'b']]);
    });

    it('select-all deselects when the section is already fully selected', async () => {
      const wrapper = mountSections({ modelValue: ['a', 'b'] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      const selectAll = wrapper.get('button[data-selection-control][aria-pressed="true"]');
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
      await wrapper.get('button[data-selection-control]').trigger('click');
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

    it('filters legacy options down to the ones matching the query', async () => {
      const wrapper = mountSelect({
        modelValue: [],
        searchable: true,
        searchPlaceholder: 'Search',
      });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await wrapper.get('input[placeholder="Search"]').setValue('a');
      // 'a' matches only the value "a" (Apple); "b" and "c" are filtered out.
      expect([
        wrapper.text().includes('Apple'),
        wrapper.text().includes('Banana'),
      ]).toEqual([true, false]);
    });
  });

  describe('deselecting in multiple mode', () => {
    it('removes an already-selected option, emitting the rest', async () => {
      const wrapper = mountSelect({ modelValue: ['a', 'b'] });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await clickRow(wrapper, 'Apple');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['b']]);
    });
  });

  describe('reacting to external modelValue changes', () => {
    it('syncs the displayed chips when the modelValue prop changes', async () => {
      const wrapper = mountSelect({ modelValue: ['a'] });
      await wrapper.setProps({ modelValue: ['a', 'b'] });
      const chips = wrapper.findAll('span.font-mono').map((s) => s.text());
      expect(chips).toEqual(['a', 'b']);
    });
  });

  describe('comma-separated display when chips are hidden', () => {
    it('joins the selected labels with commas', () => {
      const wrapper = mountSelect({ modelValue: ['a', 'b'], showChips: false });
      expect(wrapper.text()).toContain('Apple, Banana');
    });
  });

  describe('plain section options (no select-all, no collection)', () => {
    const plainSection = [
      {
        title: 'Fruits',
        options: [
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
        ],
      },
    ];

    it('toggles a plain section option on row click', async () => {
      const wrapper = mountWithDefaults(MultiSelect, {
        props: { options: [], sections: plainSection, multiple: true, testId: 'ms', modelValue: [] },
      });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await clickRow(wrapper, 'Apple');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['a']]);
    });

    it('shows the empty message for a section with no options', async () => {
      const wrapper = mountWithDefaults(MultiSelect, {
        props: {
          options: [],
          sections: [{ title: 'Empty', options: [], emptyMessage: 'Nothing here' }],
          testId: 'ms',
          modelValue: [],
        },
      });
      await wrapper.get('[data-testid="ms"]').trigger('click');
      expect(wrapper.text()).toContain('Nothing here');
    });
  });

  describe('select-all section preview expansion', () => {
    const bigSection = [
      {
        title: 'Forums',
        selectAllLabel: 'All forums',
        options: [
          { value: 'f1', label: 'F1' },
          { value: 'f2', label: 'F2' },
          { value: 'f3', label: 'F3' },
          { value: 'f4', label: 'F4' },
        ],
      },
    ];
    const mountBig = () =>
      mountWithDefaults(MultiSelect, {
        props: { options: [], sections: bigSection, multiple: true, testId: 'ms', modelValue: [] },
      });

    it('collapses the preview to the first three values with a "show all" toggle', async () => {
      const wrapper = mountBig();
      await wrapper.get('[data-testid="ms"]').trigger('click');
      const showAll = wrapper.findAll('button').find((b) => b.text().includes('show all'));
      expect(showAll).toBeTruthy();
    });

    it('reveals all values and offers "show less" after expanding', async () => {
      const wrapper = mountBig();
      await wrapper.get('[data-testid="ms"]').trigger('click');
      const showAll = wrapper.findAll('button').find((b) => b.text().includes('show all'))!;
      await showAll.trigger('click');
      const showLess = wrapper.findAll('button').find((b) => b.text().includes('show less'));
      expect(showLess).toBeTruthy();
    });

    it('collapses again when "show less" is clicked', async () => {
      const wrapper = mountBig();
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await wrapper.findAll('button').find((b) => b.text().includes('show all'))!.trigger('click');
      await wrapper.findAll('button').find((b) => b.text().includes('show less'))!.trigger('click');
      const showAllAgain = wrapper.findAll('button').find((b) => b.text().includes('show all'));
      expect(showAllAgain).toBeTruthy();
    });
  });

  describe('collection sections', () => {
    const collectionSection = (channels: string[]) => [
      {
        title: 'Collections',
        isCollectionSection: true,
        options: [{ value: 'col1', label: 'My Collection', channels }],
      },
    ];
    const mountCollection = (channels: string[], modelValue: string[] = []) =>
      mountWithDefaults(MultiSelect, {
        props: {
          options: [],
          sections: collectionSection(channels),
          multiple: true,
          testId: 'ms',
          modelValue,
        },
      });

    it('selects every channel in the collection on row click', async () => {
      const wrapper = mountCollection(['x', 'y']);
      await wrapper.get('[data-testid="ms"]').trigger('click');
      await clickRow(wrapper, 'My Collection');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['x', 'y']]);
    });

    it('deselects every channel when the collection is already fully selected', async () => {
      const wrapper = mountCollection(['x', 'y'], ['x', 'y']);
      await wrapper.get('[data-testid="ms"]').trigger('click');
      const checkbox = wrapper.get(
        'button[data-selection-control][aria-label="Select all forums in My Collection"]'
      );
      expect(checkbox.attributes('aria-pressed')).toBe('true');
      await clickRow(wrapper, 'My Collection');
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([[]]);
    });

    it('expands a collection with more than three channels and collapses again', async () => {
      const wrapper = mountCollection(['a', 'b', 'c', 'd']);
      await wrapper.get('[data-testid="ms"]').trigger('click');
      const showMore = wrapper.findAll('button').find((b) => b.text().includes('show more'))!;
      await showMore.trigger('click');
      const showLess = wrapper.findAll('button').find((b) => b.text().includes('show less'))!;
      await showLess.trigger('click');
      const showMoreAgain = wrapper.findAll('button').find((b) => b.text().includes('show more'));
      expect(showMoreAgain).toBeTruthy();
    });
  });
});
