import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AddToListModalHost from '@/components/collection/AddToListModalHost.vue';
import { useAddToListModalStore } from '@/stores/addToListModalStore';

const AddToListPopoverStub = {
  name: 'AddToListPopover',
  props: ['itemId', 'itemType', 'isVisible', 'isAlreadyFavorite', 'variant'],
  emits: ['close'],
  template: '<button class="popover" @click="$emit(\'close\')" />',
};

const mountHost = () =>
  mount(AddToListModalHost, {
    global: {
      stubs: {
        AddToListPopover: AddToListPopoverStub,
      },
    },
  });

describe('AddToListModalHost', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('does not render the popover when the modal store is closed', () => {
    const wrapper = mountHost();
    expect(wrapper.findComponent(AddToListPopoverStub).exists()).toBe(false);
  });

  it('renders the modal popover with store data when opened', () => {
    const store = useAddToListModalStore();
    store.open({
      itemId: 'd1',
      itemType: 'discussion',
      isAlreadyFavorite: true,
    });

    const wrapper = mountHost();
    expect(wrapper.findComponent(AddToListPopoverStub).props()).toEqual({
      itemId: 'd1',
      itemType: 'discussion',
      isVisible: true,
      isAlreadyFavorite: true,
      variant: 'modal',
    });
  });

  it('closes and clears the modal store when the popover emits close', async () => {
    const store = useAddToListModalStore();
    store.open({
      itemId: 'd1',
      itemType: 'discussion',
      isAlreadyFavorite: true,
    });

    const wrapper = mountHost();
    await wrapper.get('.popover').trigger('click');

    expect({
      open: store.isOpen,
      itemId: store.itemId,
      itemType: store.itemType,
      isAlreadyFavorite: store.isAlreadyFavorite,
    }).toEqual({
      open: false,
      itemId: '',
      itemType: 'discussion',
      isAlreadyFavorite: false,
    });
  });
});
