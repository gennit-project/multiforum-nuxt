import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EditScopeModal from './EditScopeModal.vue';

const mountModal = (props: Record<string, unknown> = {}) =>
  mount(EditScopeModal, {
    props: { isOpen: true, ...props },
    global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
  });

describe('EditScopeModal', () => {
  it('renders nothing when closed', () => {
    expect(mountModal({ isOpen: false }).find('[role="dialog"]').exists()).toBe(
      false
    );
  });

  it('renders the three scope options when open', () => {
    expect(mountModal().findAll('input[type="radio"]')).toHaveLength(3);
  });

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mountModal();
    await wrapper.get('[data-testid="edit-scope-cancel"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when Escape is pressed', async () => {
    const wrapper = mountModal();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('restores focus when the modal closes', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const wrapper = mount(EditScopeModal, {
      attachTo: document.body,
      props: { isOpen: true },
      global: { stubs: { Teleport: { template: '<div><slot /></div>' } } },
    });
    await wrapper.vm.$nextTick();

    await wrapper.setProps({ isOpen: false });

    expect(document.activeElement).toBe(trigger);
    wrapper.unmount();
    trigger.remove();
  });

  it('confirms with the default THIS_ONLY scope', async () => {
    const wrapper = mountModal();
    await wrapper.get('[data-testid="edit-scope-confirm"]').trigger('click');
    expect(wrapper.emitted('confirm')?.[0]).toEqual(['THIS_ONLY']);
  });

  it('confirms with the selected scope', async () => {
    const wrapper = mountModal();
    await wrapper.get('[data-testid="edit-scope-all-in-series"] input').setValue();
    await wrapper.get('[data-testid="edit-scope-confirm"]').trigger('click');
    expect(wrapper.emitted('confirm')?.[0]).toEqual(['ALL_IN_SERIES']);
  });
});
