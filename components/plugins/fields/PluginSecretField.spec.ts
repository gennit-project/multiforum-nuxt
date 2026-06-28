import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PluginSecretField from './PluginSecretField.vue';

const field = (over: Record<string, unknown> = {}) =>
  ({ key: 'sec', label: 'API Token', placeholder: 'token', type: 'secret', ...over }) as never;

const mountField = (props: Record<string, unknown> = {}) =>
  mount(PluginSecretField, { props: { field: field(), modelValue: '', ...props } });

describe('PluginSecretField', () => {
  it('shows a "Valid" status badge for a valid secret', () => {
    const wrapper = mountField({ secretStatus: { status: 'VALID' } });
    expect(wrapper.text()).toContain('Valid');
  });

  it('shows a "Not set" status for an unset secret', () => {
    const wrapper = mountField({ secretStatus: { status: 'NOT_SET' } });
    expect(wrapper.text()).toContain('Not set');
  });

  it('shows a "Set" status for an untested secret', () => {
    const wrapper = mountField({ secretStatus: { status: 'SET_UNTESTED' } });
    expect(wrapper.text()).toContain('Set');
  });

  it('emits update:modelValue when typing a new secret', async () => {
    const wrapper = mountField();
    await wrapper.get('input').setValue('s3cret');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['s3cret']);
  });

  it('shows the encrypted placeholder when a secret is already set', () => {
    const wrapper = mountField({ secretStatus: { status: 'VALID' } });
    expect(wrapper.get('input').attributes('placeholder')).toContain('encrypted');
  });
});
