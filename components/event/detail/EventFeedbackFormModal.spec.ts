import { describe, it, expect } from 'vitest';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import EventFeedbackFormModal from '@/components/event/detail/EventFeedbackFormModal.vue';

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
  mountWithDefaults(EventFeedbackFormModal, {
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

describe('EventFeedbackFormModal', () => {
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
      title: 'Explain the event issue',
      body: 'Provide moderation context.',
      open: false,
      primaryButtonText: 'Send',
      secondaryButtonText: 'Close',
    });

    expect(wrapper.findComponent(modalStub).props()).toMatchObject({
      title: 'Explain the event issue',
      body: 'Provide moderation context.',
      open: false,
      primaryButtonText: 'Send',
      secondaryButtonText: 'Close',
    });
  });

  it('renders the warning icon inside the modal', () => {
    const wrapper = mountModal();

    expect(wrapper.find('.exclamation-icon').exists()).toBe(true);
  });
});
