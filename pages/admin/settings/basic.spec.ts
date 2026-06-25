import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import BasicSettingsPage from './basic.vue';
import TextEditor from '@/components/TextEditor.vue';

describe('admin basic settings page', () => {
  it('forwards the editor update as a server description change', async () => {
    const wrapper = shallowMount(BasicSettingsPage, {
      props: { editMode: true, formValues: { serverDescription: '' } },
      global: { stubs: { FormRow: { template: '<div><slot name="content" /></div>' } } },
    });

    wrapper.findComponent(TextEditor).vm.$emit('update', 'New description');

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { serverDescription: 'New description' },
    ]);
  });
});
