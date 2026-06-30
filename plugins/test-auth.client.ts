import { defineNuxtPlugin } from 'nuxt/app';
import { nextTick } from 'vue';
import {
  setUsername,
  setEmail,
  setModProfileName,
  setIsAuthenticated,
  useIsAuthenticated,
  useUsername,
  useEmail,
  useModProfileName,
} from '@/composables/useAuthState';
import { config } from '@/config';

function readEmailFromToken(token: string) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    const decoded = JSON.parse(atob(padded)) as { email?: string };
    return decoded.email || '';
  } catch {
    return '';
  }
}

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const isAuthenticatedVar = useIsAuthenticated();
  const usernameVar = useUsername();
  const emailVar = useEmail();
  const modProfileNameVar = useModProfileName();

  // Always check for mock auth data in localStorage - this is safe because
  // mock auth data is only set by test code (Playwright)
  const syncMockAuthFromStorage = () => {
    const mockUsername = window.localStorage.getItem('mock_username');
    const mockModProfileName = window.localStorage.getItem(
      'mock_mod_profile_name'
    );
    const token = window.localStorage.getItem('token');

    if (token) {
      const email = readEmailFromToken(token);
      setIsAuthenticated(true);
      setUsername(mockUsername || '');
      setEmail(email);
      setModProfileName(mockModProfileName || '');
      isAuthenticatedVar.value = true;
      emailVar.value = email;
    }
  };

  // Sync immediately if mock auth data exists
  syncMockAuthFromStorage();

  // Expose debug functions in dev/test environments
  // Also expose if mock_username is in localStorage (indicates Playwright tests)
  const hasMockAuth =
    window.localStorage.getItem('mock_username') !== null ||
    !!window.localStorage.getItem('token');
  const shouldExpose =
    import.meta.env.DEV ||
    config.environment === 'test' ||
    import.meta.env.VITE_E2E_MOCK_MODE === 'true' ||
    hasMockAuth;

  const setAuthStateDirect = (authState: {
    username?: string;
    email?: string;
    modProfileName?: string;
    authenticated?: boolean;
  }) => {
    if (authState.authenticated !== false) {
      setIsAuthenticated(true);
      setUsername(authState.username || '');
      setEmail(authState.email || '');
      setModProfileName(authState.modProfileName || '');
      isAuthenticatedVar.value = true;
      emailVar.value = authState.email || '';
      window.localStorage.setItem('mock_username', authState.username || '');
      if (authState.modProfileName) {
        window.localStorage.setItem(
          'mock_mod_profile_name',
          authState.modProfileName
        );
      }
    } else {
      setIsAuthenticated(false);
      setUsername('');
      setEmail('');
      setModProfileName('');
      isAuthenticatedVar.value = false;
      emailVar.value = '';
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
      email: emailVar.value,
      modProfileName: modProfileNameVar.value,
      authenticated: isAuthenticatedVar.value,
      hasToken: !!localStorage.getItem('token'),
    });
  }
});
