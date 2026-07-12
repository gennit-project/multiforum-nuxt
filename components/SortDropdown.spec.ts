import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SortDropdown from './SortDropdown.vue';

// v-click-outside is a global Nuxt directive; stub it so the component mounts.
const mountDropdown = () =>
  mount(SortDropdown, {
    global: { directives: { 'click-outside': {} } },
  });

describe('SortDropdown', () => {
  it('hides the menu initially', () => {
    const wrapper = mountDropdown();
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it('opens the menu when the button is clicked', async () => {
    const wrapper = mountDropdown();
    await wrapper.find('#menu-button').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(true);
  });

  it('renders the sort options when open', async () => {
    const wrapper = mountDropdown();
    await wrapper.find('#menu-button').trigger('click');
    expect(wrapper.findAll('[role="menuitem"]')).toHaveLength(3);
  });

  it('closes the menu when the button is clicked again', async () => {
    const wrapper = mountDropdown();
    await wrapper.find('#menu-button').trigger('click');
    await wrapper.find('#menu-button').trigger('click');
    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });

  it('reflects the open state in aria-expanded', async () => {
    const wrapper = mountDropdown();
    const button = wrapper.find('#menu-button');
    expect(button.attributes('aria-expanded')).toBe('false');

    await button.trigger('click');

    expect(button.attributes('aria-expanded')).toBe('true');
  });

  it('closes the menu when Escape is pressed', async () => {
    const wrapper = mountDropdown();
    await wrapper.find('#menu-button').trigger('click');

    await wrapper.find('[role="menu"]').trigger('keydown.escape');

    expect(wrapper.find('[role="menu"]').exists()).toBe(false);
  });
});
