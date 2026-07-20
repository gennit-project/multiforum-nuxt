import { describe, expect, it } from 'vitest';

import FormRow from '@/components/FormRow.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountRow = (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) =>
  mountWithDefaults(FormRow, {
    props,
    slots,
  });

describe('FormRow', () => {
  it('renders the section title as a label', () => {
    const wrapper = mountRow({ sectionTitle: 'Email' });

    expect(wrapper.get('label').text()).toContain('Email');
  });

  it('renders the required indicator when required is true', () => {
    const wrapper = mountRow({ sectionTitle: 'Email', required: true });

    expect(wrapper.get('label').text()).toContain('*');
  });

  it('renders the description when present', () => {
    const wrapper = mountRow({ description: 'Used for notifications' });

    expect(wrapper.text()).toContain('Used for notifications');
  });

  it('uses the dangerous label styling when dangerous is true', () => {
    const wrapper = mountRow({ sectionTitle: 'Delete', dangerous: true });

    expect(wrapper.get('label').classes()).toContain('text-red-400');
  });

  it('renders the content slot', () => {
    const wrapper = mountRow({}, { content: '<input data-testid="slot-input" />' });

    expect(wrapper.get('[data-testid="slot-input"]').exists()).toBe(true);
  });

  it('associates the label with a valid (whitespace-free) generated id', () => {
    const wrapper = mountRow({ sectionTitle: 'Display Name' });

    expect(wrapper.get('label').attributes('for')).not.toMatch(/\s/);
  });
});
