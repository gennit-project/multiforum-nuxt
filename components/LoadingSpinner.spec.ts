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
});
