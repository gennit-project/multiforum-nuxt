import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { PluginFormSection } from '@/types/pluginForms';
import PluginSettingsSection from './PluginSettingsSection.vue';

const sections = [{ title: 'S', fields: [] }] as unknown as PluginFormSection[];

const mountSection = (props: Record<string, unknown> = {}) =>
  mount(PluginSettingsSection, {
    props: {
      sections,
      modelValue: {},
      errors: {},
      secretStatuses: [],
      saving: false,
      ...props,
    },
    global: {
      stubs: {
        FormRow: { template: '<div><slot name="content" /></div>' },
        PluginSettingsForm: {
          template: '<div class="form" @click="$emit(\'update:model-value\', { a: 1 })" />',
        },
      },
    },
  });

describe('PluginSettingsSection', () => {
  it('renders nothing when there are no sections', () => {
    expect(mountSection({ sections: [] }).text()).toBe('');
  });

  it('renders the settings form when there are sections', () => {
    expect(mountSection().find('.form').exists()).toBe(true);
  });

  it('emits save when the save button is clicked', async () => {
    const wrapper = mountSection();
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('disables the save button while saving', () => {
    const wrapper = mountSection({ saving: true });
    expect((wrapper.find('button').element as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it('forwards model-value updates from the form', async () => {
    const wrapper = mountSection();
    await wrapper.find('.form').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([{ a: 1 }]);
  });
});
