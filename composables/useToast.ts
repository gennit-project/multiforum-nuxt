import { storeToRefs } from 'pinia';
import { useToastStore } from '@/stores/toastStore';

type ToastType = 'success' | 'error' | 'warning' | 'info';

const DEFAULT_DURATION = 5000;

/**
 * Thin adapter over the Pinia toast store (`stores/toastStore`), which is the
 * single toast system actually rendered by `<ToastNotification>`.
 *
 * This composable used to keep its own (never-rendered) toast list, so every
 * `success()/error()/info()` call was invisible to users. It now delegates to
 * the store while preserving the original API — and the auto-dismiss timer —
 * so existing callers light up without any call-site changes.
 */
export function useToast() {
  const store = useToastStore();
  const { toasts } = storeToRefs(store);

  const showToast = (
    message: string,
    type: ToastType = 'info',
    duration = DEFAULT_DURATION
  ) => {
    // The store models success | error | info; surface warnings as info.
    const storeType = type === 'warning' ? 'info' : type;
    const id = store.showToast(message, storeType);

    if (duration > 0) {
      setTimeout(() => store.dismissToast(id), duration);
    }

    return id;
  };

  const removeToast = (id: string) => store.dismissToast(id);

  const success = (message: string, duration?: number) =>
    showToast(message, 'success', duration);
  const error = (message: string, duration?: number) =>
    showToast(message, 'error', duration);
  const warning = (message: string, duration?: number) =>
    showToast(message, 'warning', duration);
  const info = (message: string, duration?: number) =>
    showToast(message, 'info', duration);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
