import { describe, expect, it } from 'vitest';

import ErrorMessage from '@/components/ErrorMessage.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

describe('ErrorMessage', () => {
  it('renders the message text', () => {
    const wrapper = mountWithDefaults(ErrorMessage, {
      props: { text: 'This field is required' },
    });

    expect(wrapper.text()).toContain('This field is required');
  });

  it('exposes the message as an alert region', () => {
    const wrapper = mountWithDefaults(ErrorMessage, {
      props: { text: 'This field is required' },
    });

    expect(wrapper.attributes('role')).toBe('alert');
  });
});
