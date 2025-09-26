import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  function showToast(message: string, type: Toast['type'] = 'success') {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type };
    toasts.value.push(toast);
  }

  function dismissToast(id: string) {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  function clearAllToasts() {
    toasts.value = [];
  }

  return {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };
});