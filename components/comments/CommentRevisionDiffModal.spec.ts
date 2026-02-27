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

    const text = wrapper.text();
    expect({
      hasLabel: text.includes('Edit reason:'),
      hasReason: text.includes('Fixed typo'),
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

    const wrapper = mount(CommentRevisionDiffModal, {
      props: {
        open: true,
        oldVersion: {
          ...oldVersion,
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
