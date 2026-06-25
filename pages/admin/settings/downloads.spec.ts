import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import DownloadsSettingsPage from './downloads.vue';
import TextInput from '@/components/TextInput.vue';
import CheckBox from '@/components/CheckBox.vue';

const FormRowStub = {
  template: '<div><slot name="content" /></div>',
};

const buildWrapper = (formValues: Record<string, unknown>) =>
  shallowMount(DownloadsSettingsPage, {
    props: { editMode: true, formValues },
    global: { stubs: { FormRow: FormRowStub } },
  });

describe('admin downloads settings page', () => {
  it('renders the allowed file types as a comma-separated string', () => {
    const input = buildWrapper({
      enableDownloads: true,
      allowedFileTypes: ['.pdf', '.zip'],
    }).findComponent(TextInput);
    expect(input.props('value')).toBe('.pdf, .zip');
  });

  it('parses the input back into a trimmed, non-empty array on update', () => {
    const wrapper = buildWrapper({ enableDownloads: true, allowedFileTypes: [] });
    wrapper.findComponent(TextInput).vm.$emit('update', '.a, .b , , .c');
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { allowedFileTypes: ['.a', '.b', '.c'] },
    ]);
  });

  it('disables the file-type input when downloads are off', () => {
    const input = buildWrapper({ enableDownloads: false }).findComponent(
      TextInput
    );
    expect(input.props('disabled')).toBe(true);
  });

  it('forwards the enable-downloads checkbox change', () => {
    const wrapper = buildWrapper({ enableDownloads: false });
    wrapper.findComponent(CheckBox).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { enableDownloads: true },
    ]);
  });
});
