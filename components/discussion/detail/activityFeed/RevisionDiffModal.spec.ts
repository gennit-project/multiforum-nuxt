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
    props: ['open', 'title', 'error', 'loading'],
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
  it('renders edit reason when provided', () => {
    const wrapper = mount(RevisionDiffModal, {
      props: {
        open: true,
        oldVersion: baseVersion,
        newVersion,
        isMostRecent: true,
      },
    });

    expect(wrapper.text()).toContain('Edit reason:');
    expect(wrapper.text()).toContain('Updated for clarity');
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

    expect(wrapper.text()).toContain('Show 4 unchanged lines');
    expect(wrapper.text()).toContain('line 8 old');
    expect(wrapper.text()).toContain('line 8 new');
  });
});
