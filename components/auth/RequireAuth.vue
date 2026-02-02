<script setup lang="ts">
import { computed, watch, onMounted, ref } from 'vue';
import { useAuth0 } from '@auth0/auth0-vue';
import {
  isAuthenticatedVar,
  setIsLoadingAuth,
  usernameVar,
  setIsAuthenticated,
} from '@/cache';
import { useSSRAuth } from '@/composables/useSSRAuth';

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

It also has logic to prevent hydration errors and content shift.
It works like this:

SSR: We cannot know if the user is logged in. So we pretend they're not.

Client Initial Hydration: We also pretend they're not logged in, 
matching the SSR output. (No mismatch!)

Client After Mount: We check usernameVar.value. If it's non-empty,
 we flip to the "has-auth" content. That causes a normal Vue re-render, 
 not a hydration mismatch.
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

const isMounted = ref(false);
const { hasAuthHint, usernameHint, setAuthHint } = useSSRAuth();

// Remove loading state - we'll render immediately for SEO
// const isCheckingAuth = ref(true);

const isOwner = computed(() => {
  if (!usernameVar.value) return false;
  return props.owners?.includes(usernameVar.value);
});

const showAuthContent = computed(() => {
  // During SSR, use the auth hint cookie
  if (import.meta.env.SSR) {
    // If we have an auth hint, show authenticated content
    if (hasAuthHint.value) {
      // For ownership checks during SSR, use the username hint
      if (props.requireOwnership && usernameHint.value) {
        return props.owners?.includes(usernameHint.value);
      }
      return !props.requireOwnership; // Show auth content for non-ownership cases
    }
    return false; // No auth hint means not authenticated
  }

  // During initial client mount, check auth hint to match SSR
  if (!isMounted.value) {
    return (
      hasAuthHint.value &&
      (!props.requireOwnership || props.owners?.includes(usernameHint.value))
    );
  }

  // If we have a username, the user is fully authenticated
  if (usernameVar.value) {
    // If ownership is required, check that too
    if (props.requireOwnership) {
      return isOwner.value;
    }
    return true;
  }

  // If no username but authenticated, allow access to non-ownership content
  if (isAuthenticatedVar.value && !props.requireOwnership) {
    return true;
  }

  // Default: not authenticated or doesn't meet requirements
  return false;
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
  const {
    loginWithPopup,
    idTokenClaims,
    isLoading,
    loginWithRedirect,
    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();

  setIsLoadingAuth(isLoading.value);

  // Sync Auth0's authentication state with our local state
  watch(
    isAuthenticated,
    (newValue) => {
      setIsAuthenticated(newValue);
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
    // Set mounted first to prevent reactivity issues
    isMounted.value = true;

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

  handleLogin = async () => {
    try {
      // Check if we had an auth failure this session
      const hadAuthFailure = sessionStorage.getItem('authFailure');
      if (hadAuthFailure) {
        // Clear the failure flag and try fresh
        sessionStorage.removeItem('authFailure');
        clearAuthState();
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // @ts-ignore
      if (window?.parent?.Cypress || isMobile) {
        // Make sure to return early after redirect to prevent additional actions
        await loginWithRedirect();
        return;
      }

      await loginWithPopup();

      // Ensure state is updated
      if (isAuthenticated.value) {
        setIsAuthenticated(true);
        setAuthHint(true); // Set auth hint cookie after successful login
      }

      await storeToken();
    } catch (error) {
      console.error('Login error:', error);
      // Don't let login errors crash the app
    }
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
