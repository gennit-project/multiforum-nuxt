import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAddToListModalStore } from '@/stores/addToListModalStore';

describe('addToListModalStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('opens the modal with payload values', () => {
    const store = useAddToListModalStore();

    store.open({ itemId: 'item-1', itemType: 'comment', isAlreadyFavorite: true });

    expect({
      isOpen: store.isOpen,
      itemId: store.itemId,
      itemType: store.itemType,
      isAlreadyFavorite: store.isAlreadyFavorite,
    }).toEqual({
      isOpen: true,
      itemId: 'item-1',
      itemType: 'comment',
      isAlreadyFavorite: true,
    });
  });

  it('closes the modal and resets state', () => {
    const store = useAddToListModalStore();
    store.open({ itemId: 'item-1', itemType: 'comment', isAlreadyFavorite: true });

    store.close();

    expect({
      isOpen: store.isOpen,
      itemId: store.itemId,
      itemType: store.itemType,
      isAlreadyFavorite: store.isAlreadyFavorite,
    }).toEqual({
      isOpen: false,
      itemId: '',
      itemType: 'discussion',
      isAlreadyFavorite: false,
    });
  });
});
