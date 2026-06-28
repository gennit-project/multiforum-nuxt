import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginNumberField from './PluginNumberField.vue';

const field = (over: Record<string, unknown> = {}) =>
  ({ key: 'n', label: 'Max Size', placeholder: '0', type: 'number', ...over }) as never;

const mountField = (props: Record<string, unknown>) =>
  mount(PluginNumberField, {
    props: { field: field(), modelValue: undefined, ...props },
  });

describe('PluginNumberField', () => {
  it('emits a numeric value on input', async () => {
    const wrapper = mountField({});
    await wrapper.get('input').setValue('42');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([42]);
  });

  it('emits undefined when the input is cleared', async () => {
    const wrapper = mountField({ modelValue: 5 });
    await wrapper.get('input').setValue('');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([undefined]);
  });

  it('shows a range hint when min and max are set', () => {
    const wrapper = mountField({
      field: field({ validation: { min: 1, max: 10 } }),
    });
    expect(wrapper.text()).toContain('Range: 1 - 10');
  });

  it('shows a minimum-only hint', () => {
    const wrapper = mountField({ field: field({ validation: { min: 3 } }) });
    expect(wrapper.text()).toContain('Minimum: 3');
  });

  it('shows a min validation error after touch', async () => {
    const wrapper = mountField({
      field: field({ validation: { min: 10 } }),
      modelValue: 4,
    });
    await wrapper.get('input').setValue('4');
    expect(wrapper.text()).toContain('must be at least 10');
  });
});
