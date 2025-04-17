<script setup lang="ts">
import { computed, watch, onMounted, ref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { isAuthenticatedVar, setIsLoadingAuth, usernameVar, setIsAuthenticated } from "@/cache";

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
const isOwner = computed(() => {
  if (!usernameVar.value) return false;
  return props.owners?.includes(usernameVar.value);
});
const showAuthContent = computed(() => {
  // IMPORTANT: During SSR or initial mount, match the server-rendered content
  // This prevents hydration mismatches
  if (import.meta.env.SSR || !isMounted.value) {
    return false; // Assume not authenticated for SSR and initial render
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

// Only run client-side auth logic
if (import.meta.env.SSR === false) {
  const { loginWithPopup, idTokenClaims, isLoading, loginWithRedirect, isAuthenticated, getAccessTokenSilently } =
    useAuth0();

  setIsLoadingAuth(isLoading.value);
  
  // Sync Auth0's authentication state with our local state
  watch(isAuthenticated, (newValue) => {
    setIsAuthenticated(newValue);
  }, { immediate: true });

  const storeToken = async () => {
    if (isAuthenticated.value && idTokenClaims.value) {
      try {
        const token = idTokenClaims.value.__raw;
        localStorage.setItem("token", token);
      } catch (error) {
        console.error("Error storing token:", error);
      }
    }
  };
  
  // Export a function to refresh tokens that can be called when session expired errors occur
  // This needs to be exposed to the global window object so it can be called from anywhere
  const refreshTokenAndRetry = async () => {
    try {
      // Throttle refresh requests
      const lastRefreshAt = sessionStorage.getItem("tokenRefreshedAt");
      const now = Date.now();
      const thirtySecondsAgo = now - (30 * 1000); // Only refresh once every 30 seconds max
      
      if (lastRefreshAt && parseInt(lastRefreshAt) > thirtySecondsAgo) {
        // Already refreshed recently, use the existing token
        console.log("Using recently refreshed token");
        return true;
      }
      
      // Get a fresh token
      const freshToken = await getAccessTokenSilently({
        detailedResponse: true,
        cacheMode: 'off' // Force refresh
      });
      
      if (freshToken && idTokenClaims.value) {
        localStorage.setItem("token", idTokenClaims.value.__raw || '');
        sessionStorage.setItem("tokenRefreshedAt", now.toString());
        console.log("Token refreshed after session expired error");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
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
    isMounted.value = true;
    
    try {
      // Use a flag to prevent multiple refreshes on the same page load
      const hasRefreshedToken = sessionStorage.getItem("tokenRefreshedAt");
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      // Only refresh if we haven't already or if it's been more than 5 minutes
      if (!hasRefreshedToken || parseInt(hasRefreshedToken) < fiveMinutesAgo) {
        // Force token refresh on page load/refresh if authenticated
        if (isAuthenticated.value) {
          // Get a fresh token
          const freshToken = await getAccessTokenSilently({
            detailedResponse: true,
            cacheMode: 'off' // Force a new token to be fetched
          });
          
          if (freshToken) {
            // Store the ID token in localStorage for Apollo client
            localStorage.setItem("token", idTokenClaims.value?.__raw || '');
            // Set the flag to prevent multiple refreshes
            sessionStorage.setItem("tokenRefreshedAt", now.toString());
            console.log("Token refreshed on page load");
          }
        } else if (idTokenClaims.value) {
          // Handle case for returning from a redirect
          const currentToken = localStorage.getItem("token");
          const newToken = idTokenClaims.value.__raw;
          
          if (currentToken !== newToken) {
            storeToken();
            // Set the flag to prevent multiple refreshes
            sessionStorage.setItem("tokenRefreshedAt", now.toString());
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing token on mount:", error);
      // If token refresh fails, don't crash but log it
    }
  });

  handleLogin = async () => {
    try {
      // Add debug statements for troubleshooting
      console.log("Login button clicked");
      
      // @ts-ignore
      if (window?.parent?.Cypress) {
        // Make sure to return early after redirect to prevent additional actions
        console.log("Using redirect for Cypress");
        await loginWithRedirect();
        return;
      }
      
      console.log("Attempting popup login");
      await loginWithPopup();
      console.log("Popup login completed");
      
      // Ensure state is updated
      if (isAuthenticated.value) {
        setIsAuthenticated(true);
        console.log("Authentication state updated");
      }
      
      await storeToken();
    } catch (error) {
      console.error("Login error:", error);
    }
  };
}
</script>

<template>
  <div
    class="flex items-center "
    :class="[
      fullWidth ? 'w-full' : '',
      justifyLeft ? 'justify-start w-full' : 'justify-center',
    ]"
  >
    <client-only>
      <template #fallback>
        <!-- SSR Fallback - Always show unauthenticated state to prevent hydration mismatch -->
        <div
          class="w-full"
          data-auth-state="unauthenticated"
        >
          <slot name="does-not-have-auth" />
        </div>
      </template>
      
      <div
        v-if="!showAuthContent"
        class="w-full"
        data-auth-state="unauthenticated"
        @click="handleLogin"
      >
        <slot name="does-not-have-auth" />
      </div>
      <div
        v-else
        class="w-full"
        data-auth-state="authenticated"
      >
        <slot name="has-auth" />
      </div>
    </client-only>
  </div>
</template>