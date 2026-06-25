import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import FeedbackSettingsPage from './feedback.vue';
import CheckBox from '@/components/CheckBox.vue';

const buildWrapper = (formValues: Record<string, unknown>) =>
  shallowMount(FeedbackSettingsPage, { props: { formValues } });

describe('forum feedback settings page', () => {
  it('defaults the checkbox to enabled when feedbackEnabled is unset', () => {
    expect(buildWrapper({}).findComponent(CheckBox).props('checked')).toBe(true);
  });

  it('unchecks the box when feedback is explicitly disabled', () => {
    expect(
      buildWrapper({ feedbackEnabled: false }).findComponent(CheckBox).props('checked')
    ).toBe(false);
  });

  it('forwards checkbox changes as a feedbackEnabled update', () => {
    const wrapper = buildWrapper({ feedbackEnabled: true });
    wrapper.findComponent(CheckBox).vm.$emit('update', false);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { feedbackEnabled: false },
    ]);
  });
});
