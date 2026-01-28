import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast and auto-removes it after duration', async () => {
    const { useToast } = await import('@/composables/useToast');
    const { showToast, toasts } = useToast();

    showToast('Hello', 'info', 1000);
    vi.advanceTimersByTime(1000);

    expect(toasts.value).toEqual([]);
  });

  it('does not remove toast before duration elapses', async () => {
    const { useToast } = await import('@/composables/useToast');
    const { showToast, toasts } = useToast();

    showToast('Hello', 'info', 1000);
    vi.advanceTimersByTime(999);

    expect(toasts.value.length).toBe(1);
  });
});
