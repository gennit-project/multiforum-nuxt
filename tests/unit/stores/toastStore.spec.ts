import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToastStore } from '@/stores/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('adds a toast with generated id', () => {
    const store = useToastStore();
    vi.spyOn(Date, 'now').mockReturnValue(12345);

    store.showToast('Saved', 'success');

    expect(store.toasts).toEqual([
      {
        id: '12345',
        message: 'Saved',
        type: 'success',
        action: undefined,
      },
    ]);
  });

  it('removes a toast by id', () => {
    const store = useToastStore();
    store.showToast('First', 'success');
    store.showToast('Second', 'error');
    const idToRemove = store.toasts[0]?.id as string;

    store.dismissToast(idToRemove);

    expect(store.toasts.length).toBe(1);
  });

  it('clears all toasts', () => {
    const store = useToastStore();
    store.showToast('First', 'success');
    store.showToast('Second', 'error');

    store.clearAllToasts();

    expect(store.toasts).toEqual([]);
  });
});
