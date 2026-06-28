import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginTextField from './PluginTextField.vue';

const field = (over: Record<string, unknown> = {}) =>
  ({ key: 'k', label: 'API Key', placeholder: 'enter', type: 'text', ...over }) as never;

const mountField = (props: Record<string, unknown>) =>
  mount(PluginTextField, { props: { field: field(), modelValue: '', ...props } });

describe('PluginTextField', () => {
  it('renders the label, description, and required marker', () => {
    const wrapper = mountField({
      field: field({ description: 'Your key', required: true }),
    });
    expect(wrapper.text()).toContain('API Key');
    expect(wrapper.text()).toContain('Your key');
    expect(wrapper.find('span.text-red-500').text()).toBe('*');
  });

  it('emits update:modelValue when typing', async () => {
    const wrapper = mountField({});
    await wrapper.get('input').setValue('hello');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['hello']);
  });

  it('renders a textarea for the textarea field type', () => {
    const wrapper = mountField({ field: field({ type: 'textarea' }) });
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('shows a required error after the field is touched', async () => {
    const wrapper = mountField({ field: field({ required: true }), modelValue: '' });
    expect(wrapper.text()).not.toContain('is required');
    await wrapper.get('input').setValue('');
    expect(wrapper.text()).toContain('API Key is required');
  });

  it('shows a minLength error', async () => {
    const wrapper = mountField({
      field: field({ validation: { minLength: 5 } }),
      modelValue: 'ab',
    });
    await wrapper.get('input').setValue('ab');
    expect(wrapper.text()).toContain('must be at least 5 characters');
  });
});
