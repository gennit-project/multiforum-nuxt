import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RevisionDiffModal from './RevisionDiffModal.vue';

vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', template: '<div><slot /></div>' },
  DialogPanel: { name: 'DialogPanel', template: '<div><slot /></div>' },
}));

vi.mock('@/components/GenericModal.vue', () => ({
  default: {
    name: 'GenericModal',
    props: [
      'open',
      'title',
      'error',
      'loading',
      'primaryButtonText',
      'dangerButtonText',
      'dangerButtonDisabled',
      'dangerButtonLoading',
      'showSecondaryButton',
    ],
    template:
      '<div><slot name="icon"></slot><slot name="content"></slot></div>',
  },
}));

const baseVersion = {
  id: 'v1',
  body: 'old content',
  createdAt: new Date().toISOString(),
  Author: { username: 'olduser' },
};

const newVersion = {
  id: 'v2',
  body: 'new content',
  editReason: 'Updated for clarity',
  createdAt: new Date().toISOString(),
  Author: { username: 'newuser' },
};

describe('RevisionDiffModal (discussion)', () => {
  it('uses a neutral primary action and a danger redaction action', () => {
    const wrapper = mount(RevisionDiffModal, {
      props: {
        open: true,
        oldVersion: baseVersion,
        newVersion,
      },
    });

    const modal = wrapper.findComponent({ name: 'GenericModal' });
    expect(modal.props()).toMatchObject({
      primaryButtonText: 'Close',
      dangerButtonText: 'Redact revision',
      dangerButtonDisabled: false,
      showSecondaryButton: false,
    });
  });

  it('renders edit reason when provided', () => {
    const wrapper = mount(RevisionDiffModal, {
      props: {
        open: true,
        oldVersion: baseVersion,
        newVersion,
        isMostRecent: true,
      },
    });

    const text = wrapper.text();
    expect({
      hasLabel: text.includes('Edit reason:'),
      hasReason: text.includes('Updated for clarity'),
    }).toEqual({
      hasLabel: true,
      hasReason: true,
    });
  });

  it('collapses unchanged lines and keeps context around changes', () => {
    const oldBody = [
      'line 1',
      'line 2',
      'line 3',
      'line 4',
      'line 5',
      'line 6',
      'line 7',
      'line 8 old',
      'line 9',
      'line 10',
      'line 11',
      'line 12',
      'line 13',
      'line 14',
      'line 15',
    ].join('\n');

    const newBody = oldBody.replace('line 8 old', 'line 8 new');

    const wrapper = mount(RevisionDiffModal, {
      props: {
        open: true,
        oldVersion: {
          ...baseVersion,
          body: oldBody,
        },
        newVersion: {
          ...newVersion,
          body: newBody,
        },
      },
    });

    const text = wrapper.text();
    expect({
      hasCollapsedIndicator: text.includes('Show 4 unchanged lines'),
      hasOldLine: text.includes('line 8 old'),
      hasNewLine: text.includes('line 8 new'),
    }).toEqual({
      hasCollapsedIndicator: true,
      hasOldLine: true,
      hasNewLine: true,
    });
  });
});
