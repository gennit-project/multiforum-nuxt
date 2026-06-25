import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import CalendarSettingsPage from './calendar.vue';
import CheckBox from '@/components/CheckBox.vue';

const FormRowStub = {
  template: '<div><slot name="content" /></div>',
};

const buildWrapper = (enableEvents: boolean) =>
  shallowMount(CalendarSettingsPage, {
    props: { editMode: true, formValues: { enableEvents } },
    global: { stubs: { FormRow: FormRowStub } },
  });

describe('admin calendar settings page', () => {
  it('reflects the enableEvents value in the checkbox', () => {
    expect(buildWrapper(true).findComponent(CheckBox).props('checked')).toBe(
      true
    );
  });

  it('shows the disabled note when events are off', () => {
    expect(buildWrapper(false).text()).toContain(
      'existing events will not be accessible'
    );
  });

  it('forwards checkbox changes as an enableEvents update', () => {
    const wrapper = buildWrapper(false);
    wrapper.findComponent(CheckBox).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { enableEvents: true },
    ]);
  });
});
