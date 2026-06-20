// composables/useServerLogout.ts
//
// SPIKE Phase 3 — single logout path for the server-session migration.
//
// Now that auth state is read from the server session, logout must clear that
// session (not just the SPA's localStorage token). /auth/logout (mounted by
// @auth0/auth0-nuxt) clears the encrypted session cookie and performs a
// federated Auth0 logout, so the Auth0 SSO cookie is gone too and the SPA can't
// silently re-authenticate on the next load.
//
// We still clear the SPA's localStorage token first, since Apollo reads that
// token (plugins/apollo-auth.client.ts) until it is wired directly to the
// server session. This is the one place that knows about both systems.
import { setIsAuthenticated, setUsername } from '@/cache';
import { clearPersistedAuth } from '@/utils/authUtils';

export const useServerLogout = () => {
  const logout = () => {
    if (typeof window === 'undefined') {
      return;
    }
    // Remember where to return after logging back in.
    try {
      localStorage.setItem(
        'postLogoutRedirect',
        window.location.pathname + window.location.search
      );
    } catch {
      // ignore storage failures
    }
    // Clear the SPA side (localStorage token + persisted username), then hand
    // off to the server route for the session + federated Auth0 logout.
    setIsAuthenticated(false);
    setUsername('');
    clearPersistedAuth();
    window.location.href = '/auth/logout';
  };

  return { logout };
};
