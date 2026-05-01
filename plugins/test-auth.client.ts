import { defineNuxtPlugin } from 'nuxt/app';
import { nextTick } from 'vue';
import {
  setUsername,
  setIsAuthenticated,
  isAuthenticatedVar,
  usernameVar,
} from '@/cache';
import { config } from '@/config';

export default defineNuxtPlugin(() => {
  const shouldExpose =
    import.meta.env.DEV ||
    config.environment === 'test' ||
    (typeof window !== 'undefined' && (window as any).Cypress);

  if (!shouldExpose || typeof window === 'undefined') {
    return;
  }

  const syncMockAuthFromStorage = () => {
    const mockUsername = window.localStorage.getItem('mock_username');
    const token = window.localStorage.getItem('token');

    if (mockUsername && token) {
      setIsAuthenticated(true);
      setUsername(mockUsername);
      isAuthenticatedVar.value = true;
    }
  };

  const setAuthStateDirect = (authState: {
    username?: string;
    authenticated?: boolean;
  }) => {
    if (authState.authenticated !== false) {
      setIsAuthenticated(true);
      setUsername(authState.username || '');
      isAuthenticatedVar.value = true;
      if (authState.username) {
        window.localStorage.setItem('mock_username', authState.username);
      }
    } else {
      setIsAuthenticated(false);
      setUsername('');
      isAuthenticatedVar.value = false;
      window.localStorage.removeItem('mock_username');
    }

    nextTick(() => {
    });
  };

  syncMockAuthFromStorage();
  (window as any).__SET_AUTH_STATE_DIRECT__ = setAuthStateDirect;
  (window as any).__DEBUG_AUTH_STATE__ = () => ({
    username: usernameVar.value,
    authenticated: isAuthenticatedVar.value,
    hasToken: !!localStorage.getItem('token'),
  });
});
