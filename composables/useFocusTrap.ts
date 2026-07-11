import { watch, nextTick, onBeforeUnmount, type Ref } from 'vue';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

type UseFocusTrapOptions = {
  /** Whether the trap is currently active (i.e. the dialog/drawer is open). */
  active: Ref<boolean>;
  /** Called when the user presses Escape while the trap is active. */
  onEscape: () => void;
  /**
   * Optional fallback element to move focus to when the trap deactivates, used
   * when the element that had focus before opening is gone (e.g. a trigger that
   * unmounts while the drawer is open).
   */
  fallbackTrigger?: () => HTMLElement | null;
};

/**
 * Modal focus management for a dialog/drawer: on activate, remember what had
 * focus and move focus into the panel; while active, keep Tab/Shift+Tab cycling
 * within the panel and close on Escape; on deactivate, restore focus.
 *
 * Guarded on `document` (not `import.meta.client`) so it stays SSR-safe while
 * still running under jsdom in unit tests.
 */
export function useFocusTrap(
  panel: Ref<HTMLElement | null>,
  options: UseFocusTrapOptions
) {
  let previouslyFocused: HTMLElement | null = null;

  const focusableElements = (): HTMLElement[] => {
    if (!panel.value) return [];
    return Array.from(
      panel.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      options.onEscape();
      return;
    }
    if (event.key !== 'Tab') return;

    const elements = focusableElements();
    if (!elements.length) return;

    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const insidePanel = !!active && !!panel.value?.contains(active);

    if (event.shiftKey) {
      if (!insidePanel || active === first) {
        event.preventDefault();
        last.focus();
      }
    } else if (!insidePanel || active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const activate = async () => {
    if (typeof document === 'undefined') return;
    previouslyFocused = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    focusableElements()[0]?.focus();
  };

  const deactivate = () => {
    if (typeof document === 'undefined') return;
    document.removeEventListener('keydown', onKeydown);
    const restoreTarget =
      previouslyFocused && previouslyFocused.isConnected
        ? previouslyFocused
        : (options.fallbackTrigger?.() ?? null);
    restoreTarget?.focus?.();
    previouslyFocused = null;
  };

  watch(
    options.active,
    (open) => {
      if (open) activate();
      else deactivate();
    },
    { immediate: true }
  );

  onBeforeUnmount(deactivate);

  // Exposed for testing / advanced callers.
  return { focusableElements };
}
