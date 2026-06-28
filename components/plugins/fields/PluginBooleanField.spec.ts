import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginBooleanField from './PluginBooleanField.vue';

const field = (over: Record<string, unknown> = {}) =>
  ({ key: 'b', label: 'Enabled', type: 'boolean', ...over }) as never;

const mountField = (props: Record<string, unknown> = {}) =>
  mount(PluginBooleanField, {
    props: { field: field(), modelValue: false, ...props },
  });

describe('PluginBooleanField', () => {
  it('renders a toggle labelled by the field', () => {
    const wrapper = mountField();
    expect(wrapper.get('button[aria-label="Enabled"]').exists()).toBe(true);
  });

  it('reflects the model value in aria-checked', () => {
    expect(
      mountField({ modelValue: true }).get('button').attributes('aria-checked')
    ).toBe('true');
  });

  it('emits the flipped value when toggled', async () => {
    const wrapper = mountField({ modelValue: false });
    await wrapper.get('button[aria-label="Enabled"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true]);
  });

  it('shows a required error while still disabled after interaction', async () => {
    const wrapper = mountField({
      field: field({ required: true }),
      modelValue: false,
    });
    await wrapper.get('button[aria-label="Enabled"]').trigger('click');
    expect(wrapper.text()).toContain('Enabled must be enabled');
  });
});
