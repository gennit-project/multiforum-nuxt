import { ref, computed } from 'vue';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type UseSettingAutosaveParams<T> = {
  /**
   * Persist the given payload. Typically wraps a GraphQL mutation and sends a
   * SCOPED update input (only the changed field), so it is safe to call
   * independently of any surrounding form-wide save.
   */
  save: (payload: T) => Promise<unknown>;
  /** Debounce window in ms. Rapid changes within this window collapse into one save. */
  debounceMs?: number;
  /** How long the "saved" state stays visible before returning to idle. */
  savedResetMs?: number;
};

/**
 * Debounced autosave for a single settings value, with visible save state.
 *
 * - Coalesces rapid changes: only the latest payload within the debounce
 *   window is saved.
 * - Skips no-op saves: if the payload matches what was last saved, nothing is
 *   sent.
 * - Avoids overlapping saves: a change made while a save is in flight is
 *   applied after it settles (only if still different).
 *
 * The `save` callback is injected so this composable stays independent of
 * Apollo and is unit-testable without mounting a component.
 */
export function useSettingAutosave<T>(params: UseSettingAutosaveParams<T>) {
  const { save, debounceMs = 500, savedResetMs = 2000 } = params;

  const status = ref<AutosaveStatus>('idle');
  const error = ref<Error | null>(null);

  const isSaving = computed(() => status.value === 'saving');
  const saved = computed(() => status.value === 'saved');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let savedResetTimer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let pendingPayload: { value: T } | null = null;
  // Serialized snapshot of the last successfully saved payload, used to skip
  // redundant saves. `undefined` means "nothing saved yet".
  let lastSavedSerialized: string | undefined;

  const serialize = (payload: T) => JSON.stringify(payload);

  const runSave = async (payload: T) => {
    const serialized = serialize(payload);
    if (serialized === lastSavedSerialized) {
      // No-op: value is already persisted.
      return;
    }

    if (inFlight) {
      // A save is already running; remember the latest and let it flush after.
      pendingPayload = { value: payload };
      return;
    }

    inFlight = true;
    status.value = 'saving';
    error.value = null;

    if (savedResetTimer) {
      clearTimeout(savedResetTimer);
      savedResetTimer = null;
    }

    try {
      await save(payload);
      lastSavedSerialized = serialized;
      status.value = 'saved';
      savedResetTimer = setTimeout(() => {
        if (status.value === 'saved') {
          status.value = 'idle';
        }
      }, savedResetMs);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      status.value = 'error';
    } finally {
      inFlight = false;
      // Flush any change that arrived while we were saving.
      if (pendingPayload) {
        const next = pendingPayload.value;
        pendingPayload = null;
        await runSave(next);
      }
    }
  };

  /** Schedule a debounced save of `payload`. Safe to call on every keystroke/toggle. */
  const trigger = (payload: T) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void runSave(payload);
    }, debounceMs);
  };

  /** Cancel any pending debounced save without persisting it. */
  const cancel = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  /**
   * Prime the last-saved snapshot from server data so the first user edit that
   * matches the current value does not trigger a redundant save.
   */
  const setInitial = (payload: T) => {
    lastSavedSerialized = serialize(payload);
  };

  return {
    status,
    error,
    isSaving,
    saved,
    trigger,
    cancel,
    setInitial,
  };
}
