import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SortDropdown from './SortDropdown.vue';

describe('SortDropdown', () => {
  it('hides the menu initially', () => {
    const wrapper = mount(SortDropdown);
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it('opens the menu when the button is clicked', async () => {
    const wrapper = mount(SortDropdown);
    await wrapper.find('#menu-button').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);
  });

  it('renders the sort options when open', async () => {
    const wrapper = mount(SortDropdown);
    await wrapper.find('#menu-button').trigger('click');
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(3);
  });

  it('closes the menu when the button is clicked again', async () => {
    const wrapper = mount(SortDropdown);
    await wrapper.find('#menu-button').trigger('click');
    await wrapper.find('#menu-button').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });
});
