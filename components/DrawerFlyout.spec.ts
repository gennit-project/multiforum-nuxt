import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import DrawerFlyout from '@/components/DrawerFlyout.vue';

vi.mock('vuetify', () => ({ useDisplay: () => ({ smAndDown: ref(false) }) }));
vi.mock('@headlessui/vue', () => ({
  TransitionRoot: { name: 'TransitionRoot', template: '<div><slot /></div>' },
  TransitionChild: { name: 'TransitionChild', template: '<div><slot /></div>' },
  Dialog: { name: 'Dialog', emits: ['close'], template: '<div><slot /></div>' },
  DialogOverlay: { name: 'DialogOverlay', template: '<div />' },
  DialogPanel: { name: 'DialogPanel', template: '<div><slot /></div>' },
}));

const mountDrawer = (props: Record<string, unknown> = {}, slot = '') =>
  mount(DrawerFlyout, {
    props: { isOpen: true, ...props },
    slots: { default: slot },
    global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, XmarkIcon: true } },
  });

describe('DrawerFlyout', () => {
  it('renders the title', () => {
    const wrapper = mountDrawer({ title: 'Recent forums' });

    expect(wrapper.text()).toContain('Recent forums');
  });

  it('renders the default slot', () => {
    const wrapper = mountDrawer({}, '<div class="body">content</div>');

    expect(wrapper.find('.body').exists()).toBe(true);
  });

  it('emits closePreview from the top close button', async () => {
    const wrapper = mountDrawer();

    await wrapper.find('[data-testid="close-drawer-top-button"]').trigger('click');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });

  it('emits closePreview from the bottom Close button', async () => {
    const wrapper = mountDrawer();

    await wrapper.find('[data-testid="close-drawer-bottom-button"]').trigger('click');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });

  it('emits closePreview from the dialog close', async () => {
    const wrapper = mountDrawer();

    await wrapper.getComponent({ name: 'Dialog' }).vm.$emit('close');

    expect(wrapper.emitted('closePreview')).toBeTruthy();
  });
});
