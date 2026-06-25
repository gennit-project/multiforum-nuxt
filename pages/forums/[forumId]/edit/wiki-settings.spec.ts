import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import WikiSettingsPage from './wiki-settings.vue';
import CheckBox from '@/components/CheckBox.vue';

const buildWrapper = (formValues: Record<string, unknown>) =>
  shallowMount(WikiSettingsPage, { props: { formValues } });

describe('forum wiki settings page', () => {
  it('reflects the wikiEnabled value in the checkbox', () => {
    expect(
      buildWrapper({ wikiEnabled: true }).findComponent(CheckBox).props('checked')
    ).toBe(true);
  });

  it('forwards checkbox changes as a wikiEnabled update', () => {
    const wrapper = buildWrapper({ wikiEnabled: false });
    wrapper.findComponent(CheckBox).vm.$emit('update', true);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { wikiEnabled: true },
    ]);
  });
});
