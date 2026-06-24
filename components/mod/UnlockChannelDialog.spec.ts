import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import UnlockChannelDialog from '@/components/mod/UnlockChannelDialog.vue';

const h = vi.hoisted(() => ({
  unlock: vi.fn(),
  error: null as unknown,
  onDone: undefined as undefined | (() => void),
}));

vi.mock('@vue/apollo-composable', () => ({
  useMutation: () => ({
    mutate: h.unlock,
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
  mount(UnlockChannelDialog, {
    props: { channelUniqueName: 'cats', open: true, ...props },
    global: { stubs: { GenericModal: genericModalStub, LockOpenIcon: true } },
  });

const modal = (w: ReturnType<typeof mount>) => w.getComponent(genericModalStub);

beforeEach(() => {
  vi.clearAllMocks();
  h.unlock = vi.fn();
  h.error = ref(null);
  h.onDone = undefined;
});

describe('UnlockChannelDialog', () => {
  it('titles the dialog with the display name', () => {
    const wrapper = mountDialog({ channelDisplayName: 'Cats Forum' });

    expect(modal(wrapper).props('title')).toBe('Unlock Forum: Cats Forum');
  });

  it('falls back to the unique name in the title', () => {
    const wrapper = mountDialog();

    expect(modal(wrapper).props('title')).toBe('Unlock Forum: cats');
  });

  it('unlocks with a null reason when none is given', async () => {
    const wrapper = mountDialog();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.unlock).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      reason: null,
    });
  });

  it('unlocks with the entered reason', async () => {
    const wrapper = mountDialog();
    await wrapper.find('textarea').setValue('resolved');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.unlock).toHaveBeenCalledWith({
      channelUniqueName: 'cats',
      reason: 'resolved',
    });
  });

  it('emits unlocked when the mutation completes', () => {
    const wrapper = mountDialog();

    h.onDone?.();

    expect(wrapper.emitted('unlocked')).toBeTruthy();
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
