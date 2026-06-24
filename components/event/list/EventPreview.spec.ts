import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import EventPreview from '@/components/event/list/EventPreview.vue';

vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', emits: ['close'], template: '<div><slot /></div>' },
  DialogOverlay: { name: 'DialogOverlay', template: '<div />' },
}));

const mountPreview = (props: Record<string, unknown> = {}) =>
  mount(EventPreview, {
    props: { isOpen: true, ...props },
    global: {
      stubs: {
        ClientOnly: { template: '<div><slot /></div>' },
        EventDetail: { name: 'EventDetail', template: '<div class="event-detail" />' },
        XmarkIcon: true,
      },
    },
  });

const closeButton = (w: ReturnType<typeof mount>) =>
  w.findAll('button').find((b) => b.text() === 'Close');

describe('EventPreview', () => {
  it('renders the event detail', () => {
    const wrapper = mountPreview();

    expect(wrapper.find('.event-detail').exists()).toBe(true);
  });

  it('emits closePreview from the X button', async () => {
    const wrapper = mountPreview();

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });

  it('emits closePreview from the Close button', async () => {
    const wrapper = mountPreview();

    await closeButton(wrapper)!.trigger('click');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });

  it('emits closePreview from the dialog close', async () => {
    const wrapper = mountPreview();

    await wrapper.getComponent({ name: 'Dialog' }).vm.$emit('close');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });
});
