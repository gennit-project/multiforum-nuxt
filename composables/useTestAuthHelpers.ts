// composables/useTestAuthHelpers.ts
import { nextTick, onMounted } from 'vue';
import {
  setUsername,
  setIsAuthenticated,
  useIsAuthenticated,
} from '@/composables/useAuthState';
import { config } from '@/config';

export function useTestAuthHelpers() {
  const isAuthenticatedVar = useIsAuthenticated();
  const isDevRuntime = import.meta.env.DEV;
  const isTestEnv =
    config.environment === 'test' ||
    (typeof window !== 'undefined' && window.Cypress);
  const shouldExpose = isDevRuntime || isTestEnv;

  if (!shouldExpose) return;

  // Create the auth state setter function
  const setAuthStateDirect = (authState?: {
    username?: string;
    authenticated?: boolean;
  }) => {
    if (authState?.authenticated !== false && authState?.username) {
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
      window.__SET_AUTH_STATE_DIRECT__ = setAuthStateDirect;
    }
  };

  // Expose immediately on the client so Cypress can set auth state before
  // page-specific components finish mounting.
  exposeToWindow();

  // Re-expose after mount as a safety net for hydration and route transitions.
  onMounted(() => {
    exposeToWindow();
  });

  return {
    setAuthStateDirect,
  };
}
