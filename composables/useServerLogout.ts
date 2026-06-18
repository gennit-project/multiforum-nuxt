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
// We still clear the SPA's localStorage token + auth-hint cookies first, since
// Apollo currently reads that token (until Phase 2) and the cookie shim is
// still present (until Phase 4). This is the one place that knows about both
// systems during the transition.
import { setIsAuthenticated, setUsername } from '@/cache';
import { useSSRAuth } from '@/composables/useSSRAuth';
import { clearPersistedAuth } from '@/utils/authUtils';

export const useServerLogout = () => {
  const { clearAuthHints } = useSSRAuth();

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
    // Clear the SPA side (localStorage token + persisted username) and the
    // auth-hint cookies, then hand off to the server route for the session +
    // federated Auth0 logout.
    setIsAuthenticated(false);
    setUsername('');
    clearPersistedAuth();
    clearAuthHints();
    window.location.href = '/auth/logout';
  };

  return { logout };
};
