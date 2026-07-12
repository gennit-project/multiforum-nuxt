import { describe, expect, it } from 'vitest';

import DatePicker from '@/components/event/form/DatePicker.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountPicker = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(DatePicker, {
    props: {
      value: '2024-07-11',
      ...props,
    },
  });

describe('DatePicker', () => {
  it('renders the current value on the native input', () => {
    const wrapper = mountPicker();

    expect(wrapper.get('input').element.value).toBe('2024-07-11');
  });

  it('uses the default test id when none is provided', () => {
    const wrapper = mountPicker();

    expect(wrapper.get('input').attributes('data-testid')).toBe('date-picker');
  });

  it('passes through a custom aria label', () => {
    const wrapper = mountPicker({ ariaLabel: 'Choose start date' });

    expect(wrapper.get('input').attributes('aria-label')).toBe('Choose start date');
  });

  it('adds the disabled styling classes when disabled', () => {
    const wrapper = mountPicker({ disabled: true });

    expect(wrapper.get('input').classes()).toContain('cursor-not-allowed');
  });

  it('emits the updated value on input', async () => {
    const wrapper = mountPicker();

    await wrapper.get('input').setValue('2024-08-12');

    expect(wrapper.emitted('update')?.[0]).toEqual(['2024-08-12']);
  });
});
