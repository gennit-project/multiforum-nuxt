import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import SuspendModModal from '@/components/mod/SuspendModModal.vue';

const h = vi.hoisted(() => ({
  suspendMod: vi.fn(() => Promise.resolve()),
  error: null as unknown,
  onDone: undefined as undefined | (() => void),
  refetch: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { refetchQueries: h.refetch } }),
  useMutation: () => ({
    mutate: h.suspendMod,
    loading: ref(false),
    error: h.error,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const genericModalStub = {
  name: 'GenericModal',
  props: ['open', 'title', 'body', 'error', 'loading', 'primaryButtonDisabled'],
  emits: ['primary-button-click', 'close'],
  template: '<div><slot name="content" /></div>',
};

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(SuspendModModal, {
    props: { open: true, issueId: 'issue-1', ...props },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        TextEditor: { name: 'TextEditor', emits: ['update'], template: '<div />' },
        UserMinus: true,
      },
    },
  });

const modal = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'GenericModal' });

beforeEach(() => {
  vi.clearAllMocks();
  h.error = ref(null);
  h.onDone = undefined;
});

describe('SuspendModModal title', () => {
  it('uses the default title', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('title')).toBe('Suspend Mod');
  });

  it('uses a custom title when provided', () => {
    const wrapper = mountModal({ title: 'Suspend This Mod' });

    expect(modal(wrapper).props('title')).toBe('Suspend This Mod');
  });

  it('passes the mutation error to the modal', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountModal();

    expect(modal(wrapper).props('error')).toBe('boom');
  });
});

describe('SuspendModModal submit', () => {
  it('suspends for a fixed term by default', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.suspendMod).toHaveBeenCalledWith(
      expect.objectContaining({ issueID: 'issue-1', suspendIndefinitely: false })
    );
  });

  it('sends a non-null suspendUntil for a fixed term', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.suspendMod.mock.calls[0][0].suspendUntil).not.toBeNull();
  });

  it('suspends indefinitely when that length is selected', async () => {
    const wrapper = mountModal();
    await wrapper.get('select').setValue('indefinite');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.suspendMod).toHaveBeenCalledWith(
      expect.objectContaining({ suspendIndefinitely: true, suspendUntil: null })
    );
  });

  it('does not suspend when there is no issue id', async () => {
    const wrapper = mountModal({ issueId: '' });

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.suspendMod).not.toHaveBeenCalled();
  });
});

describe('SuspendModModal lifecycle', () => {
  it('refetches and emits success when the mutation completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('suspendedSuccessfully')).toBeTruthy();
  });

  it('refetches the issue query on success', () => {
    mountModal();

    h.onDone?.();

    expect(h.refetch).toHaveBeenCalled();
  });

  it('emits close from the modal', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
