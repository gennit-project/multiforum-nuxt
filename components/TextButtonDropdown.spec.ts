import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import TextButtonDropdown from '@/components/TextButtonDropdown.vue';

vi.mock('@headlessui/vue', () => ({
  Menu: { name: 'Menu', template: '<div><slot /></div>' },
  MenuButton: { name: 'MenuButton', template: '<button class="menu-button" v-bind="$attrs"><slot /></button>' },
  MenuItems: { name: 'MenuItems', template: '<div><slot /></div>' },
  MenuItem: { name: 'MenuItem', template: '<div class="menu-item"><slot :active="false" /></div>' },
}));

const mountDropdown = (props: Record<string, unknown> = {}) =>
  mount(TextButtonDropdown, {
    props: { items: [{ value: 'new', label: 'New' }], ...props },
    global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, ChevronDownIcon: true, SortIcon: true } },
  });

const items = (w: ReturnType<typeof mount>) => w.findAll('.menu-item');

describe('TextButtonDropdown', () => {
  it('renders the label', () => {
    const wrapper = mountDropdown({ label: 'Sort' });

    expect(wrapper.text()).toContain('Sort');
  });

  // Regression: the trigger paired focus:outline-none with no ring width,
  // leaving keyboard focus invisible (WCAG 2.4.7).
  it('renders a focus ring width on the trigger', () => {
    const wrapper = mountDropdown({ label: 'Sort' });

    expect(wrapper.get('.menu-button').classes()).toContain(
      'focus-visible:ring-2'
    );
  });

  it('renders the menu items', () => {
    const wrapper = mountDropdown({ items: [{ value: 'a', label: 'Item A' }] });

    expect(wrapper.text()).toContain('Item A');
  });

  it('shows the sort icon when enabled', () => {
    const wrapper = mountDropdown({ showSortIcon: true });

    expect(wrapper.find('sort-icon-stub').exists()).toBe(true);
  });

  it('emits clickedItem with the value', async () => {
    const wrapper = mountDropdown({ items: [{ value: 'top', label: 'Top' }] });

    await items(wrapper)[0].trigger('click');

    expect(wrapper.emitted('clickedItem')?.[0]).toEqual(['top']);
  });
});
