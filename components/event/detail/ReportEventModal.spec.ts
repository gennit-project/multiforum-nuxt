import { describe, it, expect } from 'vitest';
import ReportEventModal from '@/components/event/detail/ReportEventModal.vue';
import { mountWithDefaults } from '@/tests/utils/mountWithDefaults';
import {
  genericModalStub,
  textEditorStub,
} from '@/tests/utils/componentStubs';

const mountModal = (props: Record<string, unknown> = {}) =>
  mountWithDefaults(ReportEventModal, {
    props: {
      open: true,
      ...props,
    },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        FlagIcon: { name: 'FlagIcon', template: '<svg class="flag-icon" />' },
        TextEditor: textEditorStub,
      },
    },
  });

describe('ReportEventModal', () => {
  it('passes the report-event copy and button labels to GenericModal', () => {
    const wrapper = mountModal();
    expect(wrapper.findComponent(genericModalStub).props()).toMatchObject({
      highlightColor: 'red',
      title: 'Report Event',
      body:
        'Why should this event be removed? Please be specific about any rule violations.',
      open: true,
      primaryButtonText: 'Submit',
      secondaryButtonText: 'Cancel',
    });
  });

  it('renders the flag icon and report editor configuration', () => {
    const wrapper = mountModal();
    expect({
      hasFlag: wrapper.find('.flag-icon').exists(),
      editorProps: wrapper.findComponent(textEditorStub).props(),
    }).toEqual({
      hasFlag: true,
      editorProps: {
        testId: 'event-report-input',
        initialValue: '',
        placeholder: 'Explain why this event should be removed',
        disableAutoFocus: false,
        allowImageUpload: false,
      },
    });
  });

  it('accepts the open=false state without changing the modal copy', () => {
    const wrapper = mountModal({ open: false });
    expect(wrapper.findComponent(genericModalStub).props('open')).toBe(false);
  });
});
