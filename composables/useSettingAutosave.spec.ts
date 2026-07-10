import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSettingAutosave } from './useSettingAutosave';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useSettingAutosave debounce', () => {
  it('does not save before the debounce window elapses', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(400);

    expect(save).not.toHaveBeenCalled();
  });

  it('coalesces rapid changes into a single save with the latest value', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(200);
    trigger('b');
    await vi.advanceTimersByTimeAsync(500);

    expect(save.mock.calls).toEqual([['b']]);
  });
});

describe('useSettingAutosave status', () => {
  it('reports the saving state while the save is in flight', async () => {
    let resolveSave: () => void = () => {};
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const { trigger, isSaving } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(500);

    expect(isSaving.value).toBe(true);
    resolveSave();
  });

  it('reports the saved state after a successful save', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger, status } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(500);

    expect(status.value).toBe('saved');
  });

  it('returns to idle after the saved window elapses', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger, status } = useSettingAutosave({
      save,
      debounceMs: 500,
      savedResetMs: 2000,
    });

    trigger('a');
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(2000);

    expect(status.value).toBe('idle');
  });

  it('captures the error and reports the error state when the save fails', async () => {
    const save = vi.fn().mockRejectedValue(new Error('boom'));
    const { trigger, status } = useSettingAutosave({
      save,
      debounceMs: 500,
    });

    trigger('a');
    await vi.advanceTimersByTimeAsync(500);

    expect(status.value).toBe('error');
  });

  it('exposes the thrown error message', async () => {
    const save = vi.fn().mockRejectedValue(new Error('boom'));
    const { trigger, error } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(500);

    expect(error.value?.message).toBe('boom');
  });
});

describe('useSettingAutosave no-op skipping', () => {
  it('does not save a value that matches the primed initial value', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger, setInitial } = useSettingAutosave({
      save,
      debounceMs: 500,
    });

    setInitial('a');
    trigger('a');
    await vi.advanceTimersByTimeAsync(500);

    expect(save).not.toHaveBeenCalled();
  });

  it('does not re-save an unchanged value after a successful save', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(500);
    trigger('a');
    await vi.advanceTimersByTimeAsync(500);

    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe('useSettingAutosave cancel', () => {
  it('cancels a pending save so it never runs', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { trigger, cancel } = useSettingAutosave({ save, debounceMs: 500 });

    trigger('a');
    await vi.advanceTimersByTimeAsync(200);
    cancel();
    await vi.advanceTimersByTimeAsync(500);

    expect(save).not.toHaveBeenCalled();
  });
});
