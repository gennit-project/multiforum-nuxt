import { describe, expect, it } from 'vitest';

import NotificationButton from '@/components/nav/NotificationButton.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

describe('NotificationButton', () => {
  it('renders a button with the accessible label', () => {
    const wrapper = mountWithDefaults(NotificationButton);

    expect(wrapper.get('button').attributes('type')).toBe('button');
    expect(wrapper.text()).toContain('View notifications');
  });

  it('renders the notification bell icon svg', () => {
    const wrapper = mountWithDefaults(NotificationButton);

    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('includes the expected focus styling classes', () => {
    const wrapper = mountWithDefaults(NotificationButton);

    expect(wrapper.get('button').classes()).toContain('focus:ring-white');
    expect(wrapper.get('button').classes()).toContain('focus:ring-offset-gray-800');
  });
});
