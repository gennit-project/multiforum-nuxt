import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CommentRevisionDiffModal from './CommentRevisionDiffModal.vue';

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

const oldVersion = {
  id: 'c1',
  body: 'old text',
  createdAt: new Date().toISOString(),
  Author: { username: 'old' },
};

const newVersion = {
  id: 'c2',
  body: 'new text',
  editReason: 'Fixed typo',
  createdAt: new Date().toISOString(),
  Author: { username: 'new' },
};

describe('CommentRevisionDiffModal', () => {
  it('shows edit reason when available', () => {
    const wrapper = mount(CommentRevisionDiffModal, {
      props: {
        open: true,
        oldVersion,
        newVersion,
        isMostRecent: true,
      },
    });

    expect(wrapper.text()).toContain('Edit reason:');
    expect(wrapper.text()).toContain('Fixed typo');
  });
});
