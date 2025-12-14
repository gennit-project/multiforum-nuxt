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
});
