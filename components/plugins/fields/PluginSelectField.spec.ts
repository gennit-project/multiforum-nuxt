import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginSelectField from './PluginSelectField.vue';

const field = (over: Record<string, unknown> = {}) =>
  ({
    key: 's',
    label: 'Mode',
    type: 'select',
    options: [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ],
    ...over,
  }) as never;

const mountField = (props: Record<string, unknown> = {}) =>
  mount(PluginSelectField, { props: { field: field(), modelValue: '', ...props } });

describe('PluginSelectField', () => {
  it('renders an option per configured option', () => {
    const wrapper = mountField();
    const labels = wrapper.findAll('option').map((o) => o.text());
    expect(labels).toContain('Option A');
    expect(labels).toContain('Option B');
  });

  it('renders a placeholder option when provided', () => {
    const wrapper = mountField({ field: field({ placeholder: 'Pick one' }) });
    expect(wrapper.text()).toContain('Pick one');
  });

  it('emits update:modelValue on selection', async () => {
    const wrapper = mountField();
    await wrapper.get('select').setValue('b');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b']);
  });

  it('shows a required error after touch', async () => {
    const wrapper = mountField({ field: field({ required: true }), modelValue: '' });
    await wrapper.get('select').setValue('');
    expect(wrapper.text()).toContain('Mode is required');
  });
});
