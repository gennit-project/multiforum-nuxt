import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import RulesSettingsPage from './rules.vue';
import RulesEditor from '@/components/RulesEditor.vue';

describe('admin rules settings page', () => {
  it('forwards rules editor updates to the parent form', async () => {
    const wrapper = shallowMount(RulesSettingsPage, {
      props: { editMode: true, formValues: { rules: [] } },
      global: { stubs: { FormRow: { template: '<div><slot name="content" /></div>' } } },
    });

    const payload = { rules: [{ summary: 'Be kind', detail: '' }] };
    wrapper.findComponent(RulesEditor).vm.$emit('update-form-values', payload);

    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([payload]);
  });
});
