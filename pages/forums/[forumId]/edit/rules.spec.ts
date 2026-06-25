import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import RulesSettingsPage from './rules.vue';

// RulesEditor is a Nuxt auto-import; stub it so we can drive its emit.
const RulesEditorStub = defineComponent({
  name: 'RulesEditor',
  props: ['formValues'],
  emits: ['update-form-values'],
  template: '<div />',
});

describe('forum rules settings page', () => {
  it('passes the form values through to the rules editor', () => {
    const formValues = { rules: [{ summary: 'Be kind', detail: '' }] };
    const wrapper = shallowMount(RulesSettingsPage, {
      props: { formValues },
      global: { stubs: { RulesEditor: RulesEditorStub } },
    });
    expect(wrapper.findComponent(RulesEditorStub).props('formValues')).toEqual(
      formValues
    );
  });

  it('forwards rules editor updates to the parent form', () => {
    const wrapper = shallowMount(RulesSettingsPage, {
      props: { formValues: { rules: [] } },
      global: { stubs: { RulesEditor: RulesEditorStub } },
    });
    const payload = { rules: [{ summary: 'New rule', detail: '' }] };
    wrapper.findComponent(RulesEditorStub).vm.$emit('update-form-values', payload);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([payload]);
  });
});
