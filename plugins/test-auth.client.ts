import { defineNuxtPlugin } from 'nuxt/app';
import { nextTick } from 'vue';
import {
  setUsername,
  setModProfileName,
  setIsAuthenticated,
  isAuthenticatedVar,
  usernameVar,
  modProfileNameVar,
} from '@/cache';
import { config } from '@/config';

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') {
    return;
  }

  // Always check for mock auth data in localStorage - this is safe because
  // mock auth data is only set by test code (Playwright, Cypress)
  const syncMockAuthFromStorage = () => {
    const mockUsername = window.localStorage.getItem('mock_username');
    const mockModProfileName = window.localStorage.getItem(
      'mock_mod_profile_name'
    );
    const token = window.localStorage.getItem('token');

    if (mockUsername && token) {
      setIsAuthenticated(true);
      setUsername(mockUsername);
      setModProfileName(mockModProfileName || '');
      isAuthenticatedVar.value = true;
    }
  };

  // Sync immediately if mock auth data exists
  syncMockAuthFromStorage();

  // Expose debug functions in dev/test environments
  // Also expose if mock_username is in localStorage (indicates Playwright tests)
  const hasMockAuth = !!window.localStorage.getItem('mock_username');
  const shouldExpose =
    import.meta.env.DEV ||
    config.environment === 'test' ||
    import.meta.env.VITE_E2E_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && window.Cypress) ||
    hasMockAuth;

  const setAuthStateDirect = (authState: {
    username?: string;
    modProfileName?: string;
    authenticated?: boolean;
  }) => {
    if (authState.authenticated !== false) {
      setIsAuthenticated(true);
      setUsername(authState.username || '');
      setModProfileName(authState.modProfileName || '');
      isAuthenticatedVar.value = true;
      if (authState.username) {
        window.localStorage.setItem('mock_username', authState.username);
      }
      if (authState.modProfileName) {
        window.localStorage.setItem(
          'mock_mod_profile_name',
          authState.modProfileName
        );
      }
    } else {
      setIsAuthenticated(false);
      setUsername('');
      setModProfileName('');
      isAuthenticatedVar.value = false;
      window.localStorage.removeItem('mock_username');
      window.localStorage.removeItem('mock_mod_profile_name');
    }

    nextTick(() => {
    });
  };

  // Only expose debug functions in dev/test environments
  if (shouldExpose) {
    window.__SET_AUTH_STATE_DIRECT__ = setAuthStateDirect;
    window.__DEBUG_AUTH_STATE__ = () => ({
      username: usernameVar.value,
      modProfileName: modProfileNameVar.value,
      authenticated: isAuthenticatedVar.value,
      hasToken: !!localStorage.getItem('token'),
    });
  }
});
