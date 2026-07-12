import { describe, expect, it } from 'vitest';

import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

describe('LoadingSpinner', () => {
  it('renders a spinning svg', () => {
    const wrapper = mountWithDefaults(LoadingSpinner);

    expect(wrapper.get('svg').classes()).toContain('animate-spin');
  });

  it('renders the dark-mode text color class on the wrapper', () => {
    const wrapper = mountWithDefaults(LoadingSpinner);

    expect(wrapper.classes()).toContain('dark:text-gray-200');
  });

  it('exposes a status role so it announces when it appears', () => {
    const wrapper = mountWithDefaults(LoadingSpinner);

    expect(wrapper.attributes('role')).toBe('status');
  });

  it('renders a visually-hidden default loading label', () => {
    const wrapper = mountWithDefaults(LoadingSpinner);

    expect(wrapper.get('.sr-only').text()).toBe('Loading…');
  });

  it('uses a custom label when provided', () => {
    const wrapper = mountWithDefaults(LoadingSpinner, {
      props: { label: 'Saving…' },
    });

    expect(wrapper.get('.sr-only').text()).toBe('Saving…');
  });
});
