import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import LockChannelDialog from '@/components/mod/LockChannelDialog.vue';

const h = vi.hoisted(() => ({
  lock: vi.fn(),
  error: null as unknown,
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.lock,
    loading: ref(false),
    error: h.error,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const genericModalStub = {
  name: 'GenericModal',
  props: ['open', 'title', 'error', 'loading', 'primaryButtonDisabled'],
  emits: ['primary-button-click', 'close'],
  template: '<div><slot name="content" /></div>',
};

const mountDialog = (props: Record<string, unknown> = {}) =>
  mount(LockChannelDialog, {
    props: { channelUniqueName: 'cats', open: true, ...props },
    global: { stubs: { GenericModal: genericModalStub, LockClosedIcon: true } },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent(genericModalStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.lock = vi.fn();
  h.error = ref(null);
  h.onDone = undefined;
});

describe('LockChannelDialog', () => {
  it('titles the dialog with the display name', () => {
    const wrapper = mountDialog({ channelDisplayName: 'Cats Forum' });

    expect(modal(wrapper).props('title')).toBe('Lock Forum: Cats Forum');
  });

  it('falls back to the unique name in the title', () => {
    const wrapper = mountDialog();

    expect(modal(wrapper).props('title')).toBe('Lock Forum: cats');
  });

  it('disables the lock button until a reason is entered', () => {
    const wrapper = mountDialog();

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(true);
  });

  it('enables the lock button once a reason is entered', async () => {
    const wrapper = mountDialog();

    await wrapper.find('textarea').setValue('spam');

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(false);
  });

  it('locks the channel with the reason', async () => {
    const wrapper = mountDialog({ issueId: 'i1' });
    await wrapper.find('textarea').setValue('spam');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.lock).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      reason: 'spam',
      issueId: 'i1',
    });
  });

  it('does not lock without a reason', async () => {
    const wrapper = mountDialog();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.lock).not.toHaveBeenCalled();
  });

  it('emits locked when the mutation completes', () => {
    const wrapper = mountDialog();

    h.onDone?.();

    expect(wrapper.emitted('locked')).toBeTruthy();
  });

  it('emits close from the modal', async () => {
    const wrapper = mountDialog();

    await modal(wrapper).vm.$emit('close');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('passes the mutation error to the modal', () => {
    h.error = ref({ message: 'boom' });
    const wrapper = mountDialog();

    expect(modal(wrapper).props('error')).toBe('boom');
  });
});
