import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import FeedbackFormModal from '@/components/comments/FeedbackFormModal.vue';

const modalStub = {
  name: 'GenericModal',
  props: [
    'highlightColor',
    'title',
    'body',
    'open',
    'primaryButtonText',
    'secondaryButtonText',
  ],
  template: '<div class="generic-modal-stub"><slot /></div>',
};

const mountModal = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(FeedbackFormModal, {
    props: {
      open: true,
      ...props,
    },
    global: {
      stubs: {
        GenericModal: modalStub,
        ExclamationIcon: {
          name: 'ExclamationIcon',
          template: '<svg class="exclamation-icon" />',
        },
      },
    },
  });

describe('FeedbackFormModal', () => {
  it('passes the default modal copy to GenericModal', () => {
    const wrapper = mountModal();

    expect(wrapper.findComponent(modalStub).props()).toMatchObject({
      highlightColor: 'yellow',
      title: 'Are you sure?',
      body: '',
      open: true,
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel',
    });
  });

  it('passes through custom modal props', () => {
    const wrapper = mountModal({
      title: 'Leave feedback',
      body: 'Share your notes for this comment.',
      open: false,
      primaryButtonText: 'Submit',
      secondaryButtonText: 'Dismiss',
    });

    expect(wrapper.findComponent(modalStub).props()).toMatchObject({
      title: 'Leave feedback',
      body: 'Share your notes for this comment.',
      open: false,
      primaryButtonText: 'Submit',
      secondaryButtonText: 'Dismiss',
    });
  });

  it('renders the warning icon inside the modal', () => {
    const wrapper = mountModal();

    expect(wrapper.find('.exclamation-icon').exists()).toBe(true);
  });
});
