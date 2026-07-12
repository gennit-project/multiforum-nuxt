import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import SaveButton from '@/components/SaveButton.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const primaryButtonStub = defineComponent({
  name: 'PrimaryButton',
  props: ['label', 'disabled', 'loading'],
  emits: ['click'],
  template: '<button class="primary-button-stub" @click="$emit(\'click\', $event)">{{ label }}</button>',
});

const mountButton = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(SaveButton, {
    props: {
      ...props,
      text: 'Save changes',
    },
    global: {
      stubs: {
        PrimaryButton: primaryButtonStub,
      },
    },
  });

describe('SaveButton', () => {
  it('passes the text through as the button label', () => {
    const wrapper = mountButton();

    expect(wrapper.getComponent(primaryButtonStub).props('label')).toBe('Save changes');
  });

  it('passes disabled through to PrimaryButton', () => {
    const wrapper = mountButton({ disabled: true });

    expect(wrapper.getComponent(primaryButtonStub).props('disabled')).toBe(true);
  });

  it('passes loading through to PrimaryButton', () => {
    const wrapper = mountButton({ loading: true });

    expect(wrapper.getComponent(primaryButtonStub).props('loading')).toBe(true);
  });

  it('emits click when PrimaryButton is clicked', async () => {
    const wrapper = mountButton();

    await wrapper.get('.primary-button-stub').trigger('click');

    expect(wrapper.emitted('click')?.length).toBe(1);
  });
});
