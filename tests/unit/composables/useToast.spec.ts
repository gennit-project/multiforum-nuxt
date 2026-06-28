import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useToast } from '@/composables/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // The composable now delegates to the Pinia toast store.
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast and auto-removes it after duration', () => {
    const { showToast, toasts } = useToast();

    showToast('Hello', 'info', 1000);
    vi.advanceTimersByTime(1000);

    expect(toasts.value).toEqual([]);
  });

  it('does not remove toast before duration elapses', () => {
    const { showToast, toasts } = useToast();

    showToast('Hello', 'info', 1000);
    vi.advanceTimersByTime(999);

    expect(toasts.value.length).toBe(1);
  });
});
