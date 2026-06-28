import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToast } from './useToast';

// The composable delegates to the Pinia toast store; a fresh Pinia per test
// gives each case an empty toast list.
beforeEach(() => {
  setActivePinia(createPinia());
});
afterEach(() => vi.useRealTimers());

describe('useToast', () => {
  it('adds a toast with the given message', () => {
    const { showToast, toasts } = useToast();
    showToast('hello');
    expect(toasts.value.at(-1)?.message).toBe('hello');
  });

  it('defaults the toast type to info', () => {
    const { showToast, toasts } = useToast();
    const id = showToast('hi');
    expect(toasts.value.find((t) => t.id === id)?.type).toBe('info');
  });

  it('uses the success type for success()', () => {
    const { success, toasts } = useToast();
    const id = success('done');
    expect(toasts.value.find((t) => t.id === id)?.type).toBe('success');
  });

  it('removes a toast by id', () => {
    const { showToast, removeToast, toasts } = useToast();
    const id = showToast('temp');
    removeToast(id);
    expect(toasts.value.find((t) => t.id === id)).toBeUndefined();
  });

  it('auto-removes a toast after its duration', () => {
    vi.useFakeTimers();
    const { showToast, toasts } = useToast();
    const id = showToast('bye', 'info', 1000);
    vi.advanceTimersByTime(1000);
    expect(toasts.value.find((t) => t.id === id)).toBeUndefined();
  });
});
