import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import SearchButton from '@/components/nav/SearchButton.vue';

const mountButton = () =>
  mount(SearchButton, {
    global: { stubs: { SearchIcon: { template: '<svg class="search-icon" />' } } },
  });

describe('SearchButton', () => {
  it('exposes an accessible name for the icon-only control', () => {
    const wrapper = mountButton();

    expect(wrapper.get('button').attributes('aria-label')).toBe('Search');
  });

  // Regression: focus:outline-none must be paired with a focus ring width or
  // keyboard focus on this icon-only button is invisible (WCAG 2.4.7).
  it('renders a focus ring width so keyboard focus stays visible', () => {
    const wrapper = mountButton();

    expect(wrapper.get('button').classes()).toContain('focus-visible:ring-2');
  });
});
