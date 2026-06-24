import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import BecomeAdminModal from '@/components/channel/BecomeAdminModal.vue';

const h = vi.hoisted(() => ({
  becomeAdmin: vi.fn(),
  error: null as unknown,
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.becomeAdmin,
    loading: ref(false),
    error: h.error,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const genericModalStub = {
  name: 'GenericModal',
  props: ['open', 'title', 'body', 'error', 'loading'],
  emits: ['primary-button-click', 'secondary-button-click'],
  template: '<div />',
};

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(BecomeAdminModal, {
    props: { channelUniqueName: 'cats', open: true, ...props },
    global: { stubs: { GenericModal: genericModalStub } },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent(genericModalStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.becomeAdmin = vi.fn();
  h.error = ref(null);
  h.onDone = undefined;
});

describe('BecomeAdminModal', () => {
  it('shows the title', () => {
    const wrapper = mountModal();

    expect(modal(wrapper).props('title')).toBe('Become an admin of this forum?');
  });

  it('requests admin with the channel name', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.becomeAdmin).toHaveBeenCalledWith({ channelUniqueName: 'cats' });
  });

  it('emits success when the mutation completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('success')).toBeTruthy();
  });

  it('emits close when the mutation completes', () => {
    const wrapper = mountModal();

    h.onDone?.();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close from the secondary button', async () => {
    const wrapper = mountModal();

    await modal(wrapper).vm.$emit('secondary-button-click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('passes the mutation error to the modal', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountModal();

    expect(modal(wrapper).props('error')).toBe('boom');
  });
});
