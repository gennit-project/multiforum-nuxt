import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UnsuspendModModal from '@/components/mod/UnsuspendModModal.vue';

const h = vi.hoisted(() => ({
  unsuspend: vi.fn(() => Promise.resolve()),
  error: null as unknown,
  onDone: undefined as undefined | (() => void),
  refetch: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({ client: { refetchQueries: h.refetch } }),
  useMutation: () => ({
    mutate: h.unsuspend,
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
  mount(UnsuspendModModal, {
    props: { open: true, issueId: 'issue-1', ...props },
    global: {
      stubs: {
        GenericModal: genericModalStub,
        TextEditor: { name: 'TextEditor', emits: ['update'], template: '<div />' },
        UserPlus: true,
      },
    },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent({ name: 'GenericModal' });

beforeEach(() => {
  vi.clearAllMocks();
  h.unsuspend = vi.fn(() => Promise.resolve());
  h.error = ref(null);
  h.onDone = undefined;
});

describe('UnsuspendModModal title', () => {
  it('uses the default title', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('title')).toBe('Unsuspend Mod');
  });

  it('uses a custom title when provided', () => {
    const wrapper = mountModal({ title: 'Unsuspend This Mod' });

    expect(modal(wrapper).props('title')).toBe('Unsuspend This Mod');
  });

  it('passes the mutation error to the modal', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountModal();

    expect(modal(wrapper).props('error')).toBe('boom');
  });
});

describe('UnsuspendModModal submit', () => {
  it('unsuspends with the issue id and explanation', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.unsuspend).toHaveBeenCalledWith(
      expect.objectContaining({ issueId: 'issue-1' })
    );
  });

  it('does not submit without an issue id', async () => {
    const wrapper = mountModal({ issueId: '' });

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.unsuspend).not.toHaveBeenCalled();
  });
});

describe('UnsuspendModModal lifecycle', () => {
  it('emits success when the mutation completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('unsuspendedSuccessfully')).toBeTruthy();
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
