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
  const shouldLog = isTestEnv && isDevRuntime;

  if (!shouldExpose) return;

  // Create the auth state setter function
  const setAuthStateDirect = (authState: {
    username: string;
    authenticated?: boolean;
  }) => {
    if (shouldLog) {
      console.log('🔧 Direct auth state update:', authState);
    }

    if (authState.authenticated !== false) {
      setIsAuthenticated(true);
      setUsername(authState.username);
      isAuthenticatedVar.value = true;
      if (shouldLog) {
        console.log('🔧 Auth state set to TRUE for user:', authState.username);
      }
    } else {
      setIsAuthenticated(false);
      setUsername('');
      isAuthenticatedVar.value = false;
      if (shouldLog) {
        console.log('🔧 Auth state set to FALSE');
      }
    }

    // Force UI reactivity update
    nextTick(() => {
      if (shouldLog) {
        console.log(
          '🔧 After nextTick - isAuthenticated:',
          isAuthenticatedVar.value,
          'username:',
          authState.username
        );
      }
    });
  };

  // Expose to window immediately
  const exposeToWindow = () => {
    if (typeof window !== 'undefined') {
      (window as any).__SET_AUTH_STATE_DIRECT__ = setAuthStateDirect;
      if (shouldLog) {
        console.log('🔧 __SET_AUTH_STATE_DIRECT__ exposed to window');
      }
    }
  };

  // Only expose after mount to prevent SSR/hydration issues
  onMounted(() => {
    exposeToWindow();
    if (shouldLog) {
      console.log('🔧 Test auth helpers exposed after mount');
    }
  });

  return {
    setAuthStateDirect,
  };
}
