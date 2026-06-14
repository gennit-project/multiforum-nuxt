import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PluginBooleanField from './PluginBooleanField.vue';
import PluginNumberField from './PluginNumberField.vue';
import PluginSecretField from './PluginSecretField.vue';
import PluginSelectField from './PluginSelectField.vue';
import PluginTextField from './PluginTextField.vue';
import type { PluginField } from '@/types/pluginForms';

describe('plugin field components', () => {
  it('renders a text field with default value and validation attributes', () => {
    const field: PluginField = {
      key: 'displayName',
      type: 'text',
      label: 'Display Name',
      default: 'Default Name',
      placeholder: 'Name',
      validation: { minLength: 3, maxLength: 20, required: true },
    };

    const wrapper = mount(PluginTextField, {
      props: {
        field,
        modelValue: undefined,
      },
    });

    const input = wrapper.get('input');

    expect({
      value: input.element.value,
      attrs: input.attributes(),
    }).toMatchObject({
      value: 'Default Name',
      attrs: {
        minlength: '3',
        maxlength: '20',
        required: '',
      },
    });
  });

  it('emits text field updates from the real input', async () => {
    const field: PluginField = {
      key: 'displayName',
      type: 'text',
      label: 'Display Name',
    };
    const wrapper = mount(PluginTextField, {
      props: {
        field,
        modelValue: '',
      },
    });

    await wrapper.get('input').setValue('Updated Name');

    expect(wrapper.emitted('update:modelValue')).toEqual([['Updated Name']]);
  });

  it('renders textarea fields with supplied content', () => {
    const field: PluginField = {
      key: 'description',
      type: 'textarea',
      label: 'Description',
    };

    const wrapper = mount(PluginTextField, {
      props: {
        field,
        modelValue: 'Long plugin description',
      },
    });

    expect(wrapper.get('textarea').element.value).toBe('Long plugin description');
  });

  it('renders a number field with range hints and attributes', () => {
    const field: PluginField = {
      key: 'maxItems',
      type: 'number',
      label: 'Max Items',
      default: 10,
      validation: { min: 1, max: 25, required: true },
    };

    const wrapper = mount(PluginNumberField, {
      props: {
        field,
        modelValue: undefined,
      },
    });

    const input = wrapper.get('input');

    expect({
      input: {
        value: input.element.value,
        attrs: input.attributes(),
      },
      text: wrapper.text(),
    }).toMatchObject({
      input: {
        value: '10',
        attrs: {
          min: '1',
          max: '25',
          required: '',
        },
      },
      text: expect.stringContaining('Range: 1 - 25'),
    });
  });

  it('emits parsed numeric values', async () => {
    const field: PluginField = {
      key: 'maxItems',
      type: 'number',
      label: 'Max Items',
    };
    const wrapper = mount(PluginNumberField, {
      props: {
        field,
        modelValue: undefined,
      },
    });

    await wrapper.get('input').setValue('42');

    expect(wrapper.emitted('update:modelValue')).toEqual([[42]]);
  });

  it('toggles boolean fields and emits the next value', async () => {
    const field: PluginField = {
      key: 'enabled',
      type: 'boolean',
      label: 'Enabled',
      default: false,
    };
    const wrapper = mount(PluginBooleanField, {
      props: {
        field,
        modelValue: false,
      },
    });

    await wrapper.get('button[role="switch"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('renders select options and emits selected values', async () => {
    const field: PluginField = {
      key: 'mode',
      type: 'select',
      label: 'Mode',
      placeholder: 'Choose mode',
      options: [
        { value: 'auto', label: 'Automatic' },
        { value: 'manual', label: 'Manual' },
      ],
    };
    const wrapper = mount(PluginSelectField, {
      props: {
        field,
        modelValue: '',
      },
    });

    await wrapper.get('select').setValue('manual');

    expect({
      options: wrapper.findAll('option').map((option) => option.text()),
      emitted: wrapper.emitted('update:modelValue'),
    }).toEqual({
      options: ['Choose mode', 'Automatic', 'Manual'],
      emitted: [['manual']],
    });
  });

  it('shows secret status and write-only copy for existing secrets', () => {
    const field: PluginField = {
      key: 'apiKey',
      type: 'secret',
      label: 'API Key',
      placeholder: 'Enter API key',
    };
    const wrapper = mount(PluginSecretField, {
      props: {
        field,
        modelValue: undefined,
        secretStatus: {
          key: 'API_KEY',
          status: 'VALID',
          lastValidatedAt: '2024-01-15T10:00:00Z',
        },
      },
    });

    expect(wrapper.text()).toContain('Valid');
  });

  it('toggles secret field visibility', async () => {
    const field: PluginField = {
      key: 'apiKey',
      type: 'secret',
      label: 'API Key',
    };
    const wrapper = mount(PluginSecretField, {
      props: {
        field,
        modelValue: 'secret-value',
      },
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.get('input').attributes('type')).toBe('text');
  });
});
