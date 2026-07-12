import { describe, expect, it } from 'vitest';

import GenericSmallButton from '@/components/GenericSmallButton.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountButton = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mountWithDefaults(GenericSmallButton, {
    props: {
      text: 'Filters',
      ...props,
    },
    slots,
  });

describe('GenericSmallButton', () => {
  it('renders the text prop', () => {
    const wrapper = mountButton();

    expect(wrapper.text()).toContain('Filters');
  });

  it('renders slot content before the text', () => {
    const wrapper = mountButton({}, { default: '<span data-testid="slot-icon">+</span>' });

    expect(wrapper.get('[data-testid="slot-icon"]').exists()).toBe(true);
  });

  it('adds the active classes when active is true', () => {
    const wrapper = mountButton({ active: true });

    expect(wrapper.classes()).toContain('border-orange-500');
    expect(wrapper.classes()).toContain('ring-orange-500');
  });

  it('does not add the active border class when inactive', () => {
    const wrapper = mountButton({ active: false });

    expect(wrapper.classes()).not.toContain('border-orange-500');
  });
});
