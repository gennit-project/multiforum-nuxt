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
