import { describe, it, expect } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import EmojiSettingsPage from './emoji.vue';
import CheckBox from '@/components/CheckBox.vue';

const buildWrapper = (formValues: Record<string, unknown>) =>
  shallowMount(EmojiSettingsPage, { props: { formValues } });

describe('forum emoji settings page', () => {
  it('defaults the checkbox to enabled when emojiEnabled is unset', () => {
    expect(buildWrapper({}).findComponent(CheckBox).props('checked')).toBe(true);
  });

  it('unchecks the box when emoji is explicitly disabled', () => {
    expect(
      buildWrapper({ emojiEnabled: false }).findComponent(CheckBox).props('checked')
    ).toBe(false);
  });

  it('forwards checkbox changes as an emojiEnabled update', () => {
    const wrapper = buildWrapper({ emojiEnabled: true });
    wrapper.findComponent(CheckBox).vm.$emit('update', false);
    expect(wrapper.emitted('updateFormValues')?.[0]).toEqual([
      { emojiEnabled: false },
    ]);
  });
});
