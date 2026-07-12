import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import EmojiPickerWrapper from '@/components/text-editor/EmojiPickerWrapper.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const emojiPickerStub = defineComponent({
  name: 'EmojiPicker',
  emits: ['emoji-click', 'close'],
  template: '<div class="emoji-picker-stub" />',
});

const mountWrapper = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(EmojiPickerWrapper, {
    props: {
      position: { top: '12px', left: '24px' },
      ...props,
    },
    global: {
      stubs: {
        EmojiPicker: emojiPickerStub,
      },
    },
  });

describe('EmojiPickerWrapper', () => {
  it('applies the provided absolute position', () => {
    const wrapper = mountWrapper();

    expect(wrapper.get('.absolute').attributes('style')).toContain('top: 12px;');
    expect(wrapper.get('.absolute').attributes('style')).toContain('left: 24px;');
  });

  it('re-emits emoji-click from the picker', async () => {
    const wrapper = mountWrapper();
    const event = { emoji: '😀' };

    await wrapper.getComponent(emojiPickerStub).vm.$emit('emoji-click', event);

    expect(wrapper.emitted('emoji-click')?.[0]).toEqual([event]);
  });

  it('re-emits close from the picker', async () => {
    const wrapper = mountWrapper();

    await wrapper.getComponent(emojiPickerStub).vm.$emit('close');

    expect(wrapper.emitted('close')?.length).toBe(1);
  });
});
