import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import ButtonContent from '@/components/ButtonContent.vue';

const mountContent = (props: Record<string, unknown> = {}, slot = 'X') =>
  mount(ButtonContent, {
    props,
    slots: { default: slot },
    global: { stubs: { LoadingSpinner: { template: '<span class="spinner" />' } } },
  });

describe('ButtonContent', () => {
  it('renders the slot when not loading', () => {
    const wrapper = mountContent({}, 'Upvote');

    expect(wrapper.text()).toContain('Upvote');
  });

  it('shows a spinner while loading', () => {
    const wrapper = mountContent({ loading: true });

    expect(wrapper.find('.spinner').exists()).toBe(true);
  });

  it('renders the count when showCount is set', () => {
    const wrapper = mountContent({ showCount: true, count: 7 });

    expect(wrapper.text()).toContain('7');
  });

  it('hides the count when showCount is false', () => {
    const wrapper = mountContent({ count: 7 });

    expect(wrapper.text()).not.toContain('7');
  });

  // The count changes when a user votes; a polite live region announces the new
  // tally to screen-reader users (WCAG 4.1.3 Status Messages).
  it('announces count changes via a polite live region', () => {
    const wrapper = mountContent({ showCount: true, count: 3 });

    expect(wrapper.get('span[aria-live]').attributes('aria-live')).toBe('polite');
  });
});
