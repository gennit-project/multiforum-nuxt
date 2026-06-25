import { computed } from 'vue';
import { useUIStore } from '@/stores/uiStore';

/**
 * Theme accessor backed by the single source of truth: the UI store.
 *
 * Previously this composable kept its OWN reactive theme state (per-call refs +
 * a separate cookie read), which meant it never reflected changes made by the
 * theme toggle — the toggle drives `uiStore.setTheme`, so any component reading
 * this composable showed a stale theme. It now delegates entirely to the store
 * so every consumer reacts to the same state.
 */
export const useAppTheme = () => {
  const uiStore = useUIStore();

  const theme = computed(() => uiStore.theme);

  const setTheme = (newTheme: string) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      uiStore.setTheme(newTheme);
    }
  };

  return {
    theme,
    setTheme,
  };
};
