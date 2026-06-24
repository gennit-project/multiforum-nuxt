import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';

import PluginSettingsForm from '@/components/plugins/PluginSettingsForm.vue';

const fieldStub = (name: string) => ({
  name,
  props: ['field', 'modelValue', 'error', 'secretStatus'],
  emits: ['update:model-value'],
  template: `<div class="${name}" />`,
});

const section = (fields: { key: string; type: string }[], overrides = {}) => ({
  title: 'General',
  description: 'General settings',
  fields,
  ...overrides,
});

const mountForm = (props: Record<string, unknown> = {}) =>
  mount(PluginSettingsForm, {
    props: {
      sections: [section([{ key: 'name', type: 'text' }])],
      modelValue: {},
      ...props,
    },
    global: {
      stubs: {
        PluginTextField: fieldStub('PluginTextField'),
        PluginNumberField: fieldStub('PluginNumberField'),
        PluginBooleanField: fieldStub('PluginBooleanField'),
        PluginSelectField: fieldStub('PluginSelectField'),
        PluginSecretField: fieldStub('PluginSecretField'),
      },
    },
  });

describe('PluginSettingsForm rendering', () => {
  it('shows the section title', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('General');
  });

  it('shows the section description', () => {
    const wrapper = mountForm();

    expect(wrapper.text()).toContain('General settings');
  });

  it('shows an empty message when there are no sections', () => {
    const wrapper = mountForm({ sections: [] });

    expect(wrapper.text()).toContain('No configuration options available');
  });
});

describe('PluginSettingsForm field selection', () => {
  it.each([
    ['text', 'PluginTextField'],
    ['textarea', 'PluginTextField'],
    ['number', 'PluginNumberField'],
    ['boolean', 'PluginBooleanField'],
    ['toggle', 'PluginBooleanField'],
    ['select', 'PluginSelectField'],
    ['secret', 'PluginSecretField'],
    ['unknown', 'PluginTextField'],
  ])('renders %s fields with %s', (type, component) => {
    const wrapper = mountForm({ sections: [section([{ key: 'f', type }])] });

    expect(wrapper.find(`.${component}`).exists()).toBe(true);
  });
});

describe('PluginSettingsForm values', () => {
  it('passes the field value from the model', () => {
    const wrapper = mountForm({ modelValue: { name: 'hi' } });

    expect(wrapper.getComponent({ name: 'PluginTextField' }).props('modelValue')).toBe('hi');
  });

  it('passes the field error', () => {
    const wrapper = mountForm({ errors: { name: 'Required' } });

    expect(wrapper.getComponent({ name: 'PluginTextField' }).props('error')).toBe('Required');
  });

  it('emits update:modelValue with the merged value', async () => {
    const wrapper = mountForm({ modelValue: { other: 1 } });

    await wrapper.getComponent({ name: 'PluginTextField' }).vm.$emit('update:model-value', 'typed');

    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual({
      other: 1,
      name: 'typed',
    });
  });

  it('passes the secret status to secret fields', () => {
    const wrapper = mountForm({
      sections: [section([{ key: 'apiKey', type: 'secret' }])],
      secretStatuses: [{ key: 'apiKey', status: 'SET' }],
    });

    expect(
      wrapper.getComponent({ name: 'PluginSecretField' }).props('secretStatus')
    ).toEqual({ key: 'apiKey', status: 'SET' });
  });
});
