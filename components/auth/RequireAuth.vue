<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import {
  isAuthenticatedVar,
  setIsLoadingAuth,
  usernameVar,
  setIsAuthenticated,
} from '@/cache';

// Type for Auth0 error objects
interface Auth0Error {
  error?: string;
  error_description?: string;
  message?: string;
}

// Type guard to safely access error properties
function isAuth0Error(error: unknown): error is Auth0Error {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('error' in error || 'message' in error)
  );
}

/*
This component is a wrapper around content that requires authentication.
It shows the content if the user is authenticated, and a login button
if they're not.

SPIKE Phase 3 — server session is the source of truth:
Auth state (isAuthenticatedVar / usernameVar) is now seeded from the encrypted
server session by plugins/auth-session.ts. That seeding is identical on the
server and on the client's first hydration render (it travels through the Nuxt
payload), so we can read it directly here — no hydration mismatch, and none of
the old "pretend logged-out, then flip after mount" dance or the auth-hint
cookie shim (useSSRAuth) is needed anymore.

(Pre-spike behavior, for reference: SSR couldn't know the user, so we rendered
logged-out and used an auth-hint cookie + isMounted to flip after mount.)
*/
const props = defineProps({
  requireOwnership: Boolean,
  owners: {
    type: Array,
    default: () => [],
  },
  justifyLeft: Boolean,
  fullWidth: Boolean,
  loading: Boolean,
});

let handleLogin = () => {};

const isOwner = computed(() => {
  if (!usernameVar.value) return false;
  return props.owners?.includes(usernameVar.value);
});

const showAuthContent = computed(() => {
  // isAuthenticatedVar / usernameVar are seeded from the server session and are
  // SSR-consistent (server render === first client render), so this branch is
  // safe to evaluate identically everywhere — no SSR special-case, no isMounted.
  if (!isAuthenticatedVar.value) {
    return false;
  }
  // Ownership-gated content additionally requires the username to match.
  if (props.requireOwnership) {
    return isOwner.value;
  }
  return true;
});

// Helper function to clear auth state safely
const clearAuthState = () => {
  try {
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    sessionStorage.removeItem('tokenRefreshedAt');
    // Clear Auth0 stored data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('auth0.sPA.')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

// Only run client-side auth logic
if (import.meta.env.SSR === false) {
  const { idTokenClaims, isLoading, isAuthenticated, getAccessTokenSilently } =
    useAuth0();

  setIsLoadingAuth(isLoading.value);

  // Sync Auth0's authentication state with our local state.
  // SPIKE Phase 3: only UPGRADE — never let the SPA's transient/absent auth
  // (false while its silent check loads, or because this user logged in via the
  // server session rather than the SPA) clobber the server-seeded session.
  // Logout clears state explicitly via useServerLogout / clearAuthState.
  watch(
    isAuthenticated,
    (newValue) => {
      if (newValue) {
        setIsAuthenticated(true);
      }
    },
    { immediate: true }
  );

  const storeToken = async () => {
    if (isAuthenticated.value && idTokenClaims.value) {
      try {
        const token = idTokenClaims.value.__raw;
        localStorage.setItem('token', token);
      } catch (error) {
        console.error('Error storing token:', error);
      }
    }
  };

  // Export a function to refresh tokens that can be called when session expired errors occur
  // This needs to be exposed to the global window object so it can be called from anywhere
  const refreshTokenAndRetry = async () => {
    try {
      // Throttle refresh requests
      const lastRefreshAt = sessionStorage.getItem('tokenRefreshedAt');
      const now = Date.now();
      const thirtySecondsAgo = now - 30 * 1000; // Only refresh once every 30 seconds max

      if (lastRefreshAt && parseInt(lastRefreshAt) > thirtySecondsAgo) {
        // Already refreshed recently, use the existing token
        return true;
      }

      try {
        // Try to get a token using the cache first
        const freshToken = await getAccessTokenSilently({
          detailedResponse: true,
        });

        if (freshToken && idTokenClaims.value) {
          localStorage.setItem('token', idTokenClaims.value.__raw || '');
          sessionStorage.setItem('tokenRefreshedAt', now.toString());
          return true;
        }
        return false;
      } catch (innerError) {
        // If there's an error with the refresh token, we need to handle it
        console.error('Error with token refresh attempt:', innerError);

        // If this is an invalid refresh token, we need to log the user out and re-authenticate
        if (
          isAuth0Error(innerError) &&
          innerError.message &&
          (innerError.message.includes('Unknown or invalid refresh token') ||
            innerError.error === 'invalid_grant')
        ) {
          clearAuthState();
          return false;
        }

        // For other errors, just return false
        return false;
      }
    } catch (error) {
      console.error('Error in refreshTokenAndRetry:', error);
      return false;
    }
  };

  // Expose the refresh function globally
  if (typeof window !== 'undefined') {
    window.refreshAuthToken = refreshTokenAndRetry;
  }

  // Watch for authentication state changes
  watch(idTokenClaims, async (claims) => {
    if (isAuthenticated.value && claims) {
      await storeToken();
    }
  });

  onMounted(async () => {
    // Wrap all auth logic in try-catch to prevent app crashes
    try {
      // Use a flag to prevent multiple refreshes on the same page load
      const hasRefreshedToken = sessionStorage.getItem('tokenRefreshedAt');
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;

      // Only refresh if we haven't already or if it's been more than 5 minutes
      if (!hasRefreshedToken || parseInt(hasRefreshedToken) < fiveMinutesAgo) {
        // Force token refresh on page load/refresh if authenticated
        if (isAuthenticated.value) {
          try {
            // First try with cacheMode: 'on' to use any existing valid tokens
            const freshToken = await getAccessTokenSilently({
              detailedResponse: true,
              cacheMode: 'on', // Try to use cached token first
            });

            if (freshToken) {
              // Store the ID token in localStorage for Apollo client
              localStorage.setItem('token', idTokenClaims.value?.__raw || '');
              // Set the flag to prevent multiple refreshes
              sessionStorage.setItem('tokenRefreshedAt', now.toString());
            }
          } catch (tokenError) {
            // Check for invalid grant specifically
            if (
              isAuth0Error(tokenError) &&
              (tokenError.error === 'invalid_grant' ||
                (tokenError.message &&
                  tokenError.message.includes('Unknown or invalid refresh token')))
            ) {
              clearAuthState();

              // Prevent further auth attempts in this session
              sessionStorage.setItem('authFailure', 'true');
              return;
            }
          }
        } else if (idTokenClaims.value) {
          // Handle case for returning from a redirect
          try {
            const currentToken = localStorage.getItem('token');
            const newToken = idTokenClaims.value.__raw;

            if (currentToken !== newToken) {
              storeToken();
              // Set the flag to prevent multiple refreshes
              sessionStorage.setItem('tokenRefreshedAt', now.toString());
            }
          } catch (storeError) {
            console.error(
              'Error storing token on redirect return:',
              storeError
            );
          }
        }
      }
    } catch (mountError) {
      console.error('Critical error in auth mount logic:', mountError);

      // Clear auth state on any critical error to prevent app crashes
      clearAuthState();

      // Set a flag to prevent infinite retry loops
      sessionStorage.setItem('authFailure', 'true');
    }
  });

  // SPIKE Phase 3: log in through the server-session SDK route instead of the
  // SPA popup/redirect. /auth/login establishes the encrypted server session
  // (and, via the shared Auth0 SSO cookie, the SPA silently authenticates too,
  // so the localStorage token Apollo still uses gets populated until Phase 2).
  handleLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  };
}
</script>

<template>
  <div
    class="flex items-center"
    :class="[
      fullWidth ? 'w-full' : '',
      justifyLeft ? 'w-full justify-start' : 'justify-center',
    ]"
  >
    <div class="w-full">
      <!-- Always render content immediately for SEO, no loading states -->
      <div
        v-if="!showAuthContent"
        class="w-full"
        data-auth-state="unauthenticated"
        @click="handleLogin"
      >
        <slot name="does-not-have-auth" />
      </div>
      <div v-else class="w-full" data-auth-state="authenticated">
        <slot name="has-auth" />
      </div>
    </div>
  </div>
</template>
