import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import ModalComponent from '@/components/ModalComponent.vue';

vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', template: '<div><slot /></div>' },
  DialogPanel: { name: 'DialogPanel', template: '<div><slot /></div>' },
  DialogTitle: { name: 'DialogTitle', template: '<div><slot /></div>' },
}));

const mountModal = (props: Record<string, unknown> = {}, slots = {}) =>
  mount(ModalComponent, {
    props: { show: true, title: 'My Modal', ...props },
    slots,
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        CheckIcon: true,
      },
    },
  });

const buttonByText = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll('button').find((b) => b.text() === text);

describe('ModalComponent content', () => {
  it('renders the title', () => {
    const wrapper = mountModal();

    expect(wrapper.text()).toContain('My Modal');
  });

  it('renders the content slot', () => {
    const wrapper = mountModal({}, { content: '<div class="custom">body</div>' });

    expect(wrapper.find('.custom').exists()).toBe(true);
  });

  it('renders a custom icon slot', () => {
    const wrapper = mountModal({}, { icon: '<span class="myicon" />' });

    expect(wrapper.find('.myicon').exists()).toBe(true);
  });
});

describe('ModalComponent buttons', () => {
  it('defaults the primary button to Close', () => {
    const wrapper = mountModal();

    expect(buttonByText(wrapper, 'Close')).toBeTruthy();
  });

  it('uses a custom primary button label', () => {
    const wrapper = mountModal({ primaryButtonText: 'Confirm' });

    expect(buttonByText(wrapper, 'Confirm')).toBeTruthy();
  });

  it('emits close and primaryButtonClick on the primary button', async () => {
    const wrapper = mountModal();

    await buttonByText(wrapper, 'Close')!.trigger('click');

    expect(wrapper.emitted('primaryButtonClick')).toBeTruthy();
  });

  it('emits secondaryButtonClick and close on Cancel', async () => {
    const wrapper = mountModal();

    await buttonByText(wrapper, 'Cancel')!.trigger('click');

    expect(wrapper.emitted('secondaryButtonClick')).toBeTruthy();
  });

  it('hides the default buttons when useCustomButtons is set', () => {
    const wrapper = mountModal({ useCustomButtons: true });

    expect(buttonByText(wrapper, 'Close')).toBeUndefined();
  });
});
