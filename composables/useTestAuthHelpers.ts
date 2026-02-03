// composables/useTestAuthHelpers.ts
import { nextTick, onMounted } from 'vue';
import { setUsername, setIsAuthenticated, isAuthenticatedVar } from '@/cache';
import { config } from '@/config';

export function useTestAuthHelpers() {
  const isDevRuntime = import.meta.env.DEV;
  const isTestEnv =
    config.environment === 'test' ||
    (typeof window !== 'undefined' && (window as any).Cypress);
  const shouldExpose = isDevRuntime || isTestEnv;

  if (!shouldExpose) return;

  // Create the auth state setter function
  const setAuthStateDirect = (authState: {
    username: string;
    authenticated?: boolean;
  }) => {
    if (authState.authenticated !== false) {
      setIsAuthenticated(true);
      setUsername(authState.username);
      isAuthenticatedVar.value = true;
    } else {
      setIsAuthenticated(false);
      setUsername('');
      isAuthenticatedVar.value = false;
    }

    // Force UI reactivity update
    nextTick(() => {
    });
  };

  // Expose to window immediately
  const exposeToWindow = () => {
    if (typeof window !== 'undefined') {
      (window as any).__SET_AUTH_STATE_DIRECT__ = setAuthStateDirect;
    }
  };

  // Only expose after mount to prevent SSR/hydration issues
  onMounted(() => {
    exposeToWindow();
  });

  return {
    setAuthStateDirect,
  };
}
