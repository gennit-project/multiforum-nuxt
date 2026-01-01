import { ref, readonly } from 'vue';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  let toastId = 0;

  const showToast = (
    message: string,
    type: Toast['type'] = 'info',
    duration = 5000
  ) => {
    const id = `toast-${++toastId}`;
    const toast: Toast = { id, message, type, duration };

    toasts.value.push(toast);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  };

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (message: string, duration?: number) =>
    showToast(message, 'success', duration);
  const error = (message: string, duration?: number) =>
    showToast(message, 'error', duration);
  const warning = (message: string, duration?: number) =>
    showToast(message, 'warning', duration);
  const info = (message: string, duration?: number) =>
    showToast(message, 'info', duration);

  return {
    toasts: readonly(toasts),
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
