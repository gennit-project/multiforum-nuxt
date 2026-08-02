import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DiscussionFlairPicker from './DiscussionFlairPicker.vue';

const flairs = [
  { id: 'question', displayName: 'Question', color: '#2563EB' },
  { id: 'guide', displayName: 'Guide', color: '#16A34A' },
];

const mountPicker = (modelValue: string[] = []) =>
  mount(DiscussionFlairPicker, {
    props: {
      channelUniqueName: 'cats',
      flairs,
      modelValue,
      required: true,
    },
    global: {
      stubs: {
        ErrorBanner: { template: '<div />' },
        LoadingSpinner: { template: '<span />' },
      },
    },
  });

describe('DiscussionFlairPicker', () => {
  it('renders each flair as an accessible multi-select option', () => {
    const wrapper = mountPicker(['question']);

    expect(
      wrapper.findAll('button').map((button) => ({
        label: button.attributes('aria-label'),
        pressed: button.attributes('aria-pressed'),
      }))
    ).toEqual([
      { label: 'Remove Question flair', pressed: 'true' },
      { label: 'Select Guide flair', pressed: 'false' },
    ]);
  });

  it('adds a flair without discarding an existing selection', async () => {
    const wrapper = mountPicker(['question']);
    await wrapper.get('[aria-label="Select Guide flair"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      ['question', 'guide'],
    ]);
  });

  it('removes a selected flair', async () => {
    const wrapper = mountPicker(['question', 'guide']);
    await wrapper.get('[aria-label="Remove Question flair"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['guide']]);
  });
});
