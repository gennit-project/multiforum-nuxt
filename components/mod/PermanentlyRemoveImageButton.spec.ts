import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import PermanentlyRemoveImageButton from '@/components/mod/PermanentlyRemoveImageButton.vue';

const h = vi.hoisted(() => ({
  remove: vi.fn(),
  removeError: { value: null as unknown },
  onDone: undefined as undefined | (() => void),
  refetchQueries: vi.fn(),
}));

vi.mock('@vue/apollo-composable', () => ({
  useApolloClient: () => ({
    client: { refetchQueries: h.refetchQueries },
  }),
  useMutation: () => ({
    mutate: h.remove,
    loading: ref(false),
    error: h.removeError,
    onDone: (cb: () => void) => {
      h.onDone = cb;
    },
  }),
}));

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(PermanentlyRemoveImageButton, {
    props: { imageId: 'image-1', ...props },
    global: {
      stubs: {
        GenericModal: {
          name: 'GenericModal',
          props: ['title', 'open', 'primaryButtonDisabled', 'error'],
          emits: ['primary-button-click', 'close'],
          template: '<div><slot name="content" /></div>',
        },
        TextEditor: {
          name: 'TextEditor',
          props: ['initialValue'],
          emits: ['update'],
          template: '<div />',
        },
        NotificationComponent: {
          name: 'NotificationComponent',
          props: ['show', 'title'],
          template: '<div />',
        },
        TrashIcon: true,
      },
    },
  });

const modal = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'GenericModal' });
const editor = (w: ReturnType<typeof mount>) =>
  w.getComponent({ name: 'TextEditor' });
const clickButton = (w: ReturnType<typeof mount>) =>
  w.get('[data-testid="permanently-remove-image-button"]').trigger('click');

beforeEach(() => {
  vi.clearAllMocks();
  h.removeError = { value: null };
  h.onDone = undefined;
});

describe('PermanentlyRemoveImageButton', () => {
  it('keeps the modal closed until the button is clicked', () => {
    const wrapper = mountButton();

    expect(modal(wrapper).props('open')).toBe(false);
  });

  it('opens the confirmation modal when the button is clicked', async () => {
    const wrapper = mountButton();

    await clickButton(wrapper);

    expect(modal(wrapper).props('open')).toBe(true);
  });

  it('does not open the modal when disabled', async () => {
    const wrapper = mountButton({ disabled: true });

    await clickButton(wrapper);

    expect(modal(wrapper).props('open')).toBe(false);
  });

  it('disables the confirm button until an explanation is entered', () => {
    const wrapper = mountButton();

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(true);
  });

  it('enables the confirm button once an explanation is entered', async () => {
    const wrapper = mountButton();

    await editor(wrapper).vm.$emit('update', 'Copyright violation');

    expect(modal(wrapper).props('primaryButtonDisabled')).toBe(false);
  });

  it('submits with the image id and explanation', async () => {
    const wrapper = mountButton();
    await editor(wrapper).vm.$emit('update', 'Copyright violation');

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.remove).toHaveBeenCalledWith({
      imageId: 'image-1',
      explanation: 'Copyright violation',
    });
  });

  it('does not submit when the explanation is empty', async () => {
    const wrapper = mountButton();

    await modal(wrapper).vm.$emit('primary-button-click');

    expect(h.remove).not.toHaveBeenCalled();
  });

  it('refetches the issue after a successful removal', () => {
    mountButton();

    h.onDone?.();

    expect(h.refetchQueries).toHaveBeenCalled();
  });

  it('emits removed-successfully after a successful removal', () => {
    const wrapper = mountButton();

    h.onDone?.();

    expect(wrapper.emitted('removed-successfully')).toBeTruthy();
  });
});
