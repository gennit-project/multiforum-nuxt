import { describe, it, expect } from 'vitest';
import WarningModal from '@/components/WarningModal.vue';
import { genericModalStub } from '@/tests/utils/componentStubs';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';

const mountModal = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(WarningModal, {
    props: {
      open: true,
      ...props,
    },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        ExclamationIcon: { name: 'ExclamationIcon', template: '<svg class="exclamation-icon" />' },
      },
    },
  });

describe('WarningModal', () => {
  it('passes the default warning configuration to GenericModal', () => {
    const wrapper = mountModal();
    expect(wrapper.findComponent(genericModalStub).props()).toMatchObject({
      dataTestid: '',
      title: 'Are you sure?',
      body: '',
      open: true,
      primaryButtonText: 'Delete',
      secondaryButtonText: 'Cancel',
      highlightColor: 'yellow',
      error: '',
      loading: false,
    });
  });

  it('passes through custom title, body, buttons, error, and loading props', () => {
    const wrapper = mountModal({
      title: 'Confirm archive',
      body: 'Archive this discussion?',
      primaryButtonText: 'Archive',
      secondaryButtonText: 'Keep',
      error: 'boom',
      loading: true,
      dataTestid: 'warn',
    });

    expect(wrapper.findComponent(genericModalStub).props()).toMatchObject({
      dataTestid: 'warn',
      title: 'Confirm archive',
      body: 'Archive this discussion?',
      open: true,
      primaryButtonText: 'Archive',
      secondaryButtonText: 'Keep',
      highlightColor: 'yellow',
      error: 'boom',
      loading: true,
    });
  });

  it('renders the trash icon when icon is set to trash', () => {
    const wrapper = mountModal({ icon: 'trash' });
    expect(wrapper.html()).toContain('fa-trash-alt');
  });

  it('renders the exclamation icon for the default icon mode', () => {
    const wrapper = mountModal();
    expect(wrapper.find('.exclamation-icon').exists()).toBe(true);
  });
});
