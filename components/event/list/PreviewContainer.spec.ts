import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import PreviewContainer from '@/components/event/list/PreviewContainer.vue';

vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', emits: ['close'], template: '<div><slot /></div>' },
  DialogOverlay: { name: 'DialogOverlay', template: '<div />' },
  DialogTitle: { name: 'DialogTitle', template: '<div><slot /></div>' },
}));

const mountContainer = (props: Record<string, unknown> = {}, slot = '') =>
  mount(PreviewContainer, {
    props: { isOpen: true, ...props },
    slots: { default: slot },
    global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, XmarkIcon: true } },
  });

describe('PreviewContainer', () => {
  it('renders the header', () => {
    const wrapper = mountContainer({ header: 'Event preview' });

    expect(wrapper.text()).toContain('Event preview');
  });

  it('renders the default slot', () => {
    const wrapper = mountContainer({}, '<div class="body">content</div>');

    expect(wrapper.find('.body').exists()).toBe(true);
  });

  it('emits closePreview from the close button', async () => {
    const wrapper = mountContainer();

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });

  it('emits closePreview from the dialog close', async () => {
    const wrapper = mountContainer();

    await wrapper.getComponent({ name: 'Dialog' }).vm.$emit('close');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });

  it('uses a lower z-index by default', () => {
    const wrapper = mountContainer();

    expect(wrapper.getComponent({ name: 'Dialog' }).classes()).toContain('z-20');
  });

  it('uses a higher z-index on the top layer', () => {
    const wrapper = mountContainer({ topLayer: true });

    expect(wrapper.getComponent({ name: 'Dialog' }).classes()).toContain('z-30');
  });
});
