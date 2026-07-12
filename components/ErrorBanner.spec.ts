import { describe, expect, it } from 'vitest';

import ErrorBanner from '@/components/ErrorBanner.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

describe('ErrorBanner', () => {
  it('renders the error text', () => {
    const wrapper = mountWithDefaults(ErrorBanner, {
      props: { text: 'Something went wrong' },
    });

    expect(wrapper.text()).toContain('Something went wrong');
  });

  it('applies the red error styling classes', () => {
    const wrapper = mountWithDefaults(ErrorBanner, {
      props: { text: 'Something went wrong' },
    });

    expect(wrapper.classes()).toContain('bg-red-100');
    expect(wrapper.classes()).toContain('text-red-500');
  });

  it('exposes the error as an assertive alert region', () => {
    const wrapper = mountWithDefaults(ErrorBanner, {
      props: { text: 'Something went wrong' },
    });

    expect(wrapper.attributes('role')).toBe('alert');
  });
});
