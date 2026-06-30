import { describe, it, expect } from 'vitest';
import GenericFeedbackFormModal from '@/components/GenericFeedbackFormModal.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  genericModalStub,
  textEditorStub,
} from '@/tests/utils/componentStubs';

const mountModal = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(GenericFeedbackFormModal, {
    props: { open: true, ...props },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        TextEditor: textEditorStub,
        CharCounter: { name: 'CharCounter', props: ['current', 'max', 'min'], template: '<div class="counter" />' },
        FlagIcon: true,
      },
    },
  });

describe('GenericFeedbackFormModal', () => {
  it('disables the primary button before the feedback reaches the minimum length', async () => {
    const wrapper = mountModal();
    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit('update', 'too short');
    const modal = wrapper.findComponent(genericModalStub);
    expect(modal.props('primaryButtonDisabled')).toBe(true);
  });

  it('emits updateFeedback and enables submission for valid feedback', async () => {
    const wrapper = mountModal();
    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit(
      'update',
      'This feedback is definitely long enough.'
    );

    const modal = wrapper.findComponent(genericModalStub);
    expect({
      emitted: wrapper.emitted('updateFeedback')?.[0],
      disabled: modal.props('primaryButtonDisabled'),
    }).toEqual({
      emitted: ['This feedback is definitely long enough.'],
      disabled: false,
    });
  });

  it('blocks bot mentions and shows the helper message', async () => {
    const wrapper = mountModal();
    await wrapper.findComponent({ name: 'TextEditor' }).vm.$emit(
      'update',
      'This feedback mentions /bot/helperbot and should be blocked.'
    );

    expect({
      disabled: wrapper.findComponent(genericModalStub).props('primaryButtonDisabled'),
      text: wrapper.text().includes('Bot mentions are only available in discussion comments.'),
    }).toEqual({
      disabled: true,
      text: true,
    });
  });

  it('keeps the primary button disabled when the parent passes an error or loading state', () => {
    const wrapper = mountModal({ error: 'boom', loading: true });
    expect(wrapper.findComponent(genericModalStub).props('primaryButtonDisabled')).toBe(true);
  });
});
