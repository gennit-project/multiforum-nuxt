import { beforeEach, describe, it, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import CommentRevisionDiffModal from './CommentRevisionDiffModal.vue';

const mutation = vi.hoisted(() => ({
  mutate: vi.fn(),
  done: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: mutation.mutate,
    loading: false,
    error: null,
    onDone: (callback: () => void) => {
      mutation.done = callback;
    },
  }),
}));

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

beforeEach(() => {
  vi.clearAllMocks();
  mutation.done = undefined;
  mutation.mutate.mockResolvedValue({});
});

describe('CommentRevisionDiffModal', () => {
  it('uses a neutral primary action and a danger redaction action', () => {
    const wrapper = mount(CommentRevisionDiffModal, {
      props: {
        open: true,
        oldVersion,
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

  it('redacts the older revision after confirmation', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    const wrapper = mount(CommentRevisionDiffModal, {
      props: { open: true, oldVersion, newVersion },
    });

    wrapper
      .findComponent({ name: 'GenericModal' })
      .vm.$emit('danger-button-click');
    await flushPromises();

    expect(mutation.mutate).toHaveBeenCalledWith({ textVersionId: 'c1' });
  });

  it('emits deletion and closure after the mutation completes', () => {
    const wrapper = mount(CommentRevisionDiffModal, {
      props: { open: true, oldVersion, newVersion },
    });

    mutation.done?.();

    expect(wrapper.emitted()).toMatchObject({ deleted: [['c1']], close: [[]] });
  });

  it('restores the redaction action after a failed mutation', async () => {
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    mutation.mutate.mockRejectedValue(new Error('denied'));
    const wrapper = mount(CommentRevisionDiffModal, {
      props: { open: true, oldVersion, newVersion },
    });

    wrapper
      .findComponent({ name: 'GenericModal' })
      .vm.$emit('danger-button-click');
    await flushPromises();

    expect(
      wrapper
        .findComponent({ name: 'GenericModal' })
        .props('dangerButtonLoading')
    ).toBe(false);
  });

  it('closes from the primary action', () => {
    const wrapper = mount(CommentRevisionDiffModal, {
      props: { open: true, oldVersion, newVersion },
    });

    wrapper
      .findComponent({ name: 'GenericModal' })
      .vm.$emit('primary-button-click');

    expect(wrapper.emitted('close')).toEqual([[]]);
  });
});
