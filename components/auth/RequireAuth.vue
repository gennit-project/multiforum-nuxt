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

<<<<<<< HEAD
    // Default: not authenticated or doesn't meet requirements
    return false;
  });

  // Helper function to clear auth state safely
  const clearAuthState = () => {
    try {
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      sessionStorage.removeItem("tokenRefreshedAt");
      // Clear Auth0 stored data
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("auth0.sPA.")) {
          localStorage.removeItem(key);
        }
      });
      console.log("Auth state cleared due to invalid tokens");
    } catch (error) {
      console.error("Error clearing auth state:", error);
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
          localStorage.setItem("token", token);
        } catch (error) {
          console.error("Error storing token:", error);
        }
      }
    };

    // Export a function to refresh tokens that can be called when session expired errors occur
    // This needs to be exposed to the global window object so it can be called from anywhere
    const refreshTokenAndRetry = async () => {
=======
  const storeToken = async () => {
    if (isAuthenticated.value && idTokenClaims.value) {
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
      
      try {
        // Try to get a token using the cache first
        const freshToken = await getAccessTokenSilently({
          detailedResponse: true
        });
        
        if (freshToken && idTokenClaims.value) {
          localStorage.setItem("token", idTokenClaims.value.__raw || '');
          sessionStorage.setItem("tokenRefreshedAt", now.toString());
          console.log("Token refreshed after session expired error");
          return true;
        }
<<<<<<< HEAD

        try {
          // Try to get a token using the cache first
          const freshToken = await getAccessTokenSilently({
            detailedResponse: true,
          });

          if (freshToken && idTokenClaims.value) {
            localStorage.setItem("token", idTokenClaims.value.__raw || "");
            sessionStorage.setItem("tokenRefreshedAt", now.toString());
            console.log("Token refreshed after session expired error");
            return true;
          }
          return false;
        } catch (innerError) {
          // If there's an error with the refresh token, we need to handle it
          console.error("Error with token refresh attempt:", innerError);

          // If this is an invalid refresh token, we need to log the user out and re-authenticate
          if (
            innerError.message &&
            (innerError.message.includes("Unknown or invalid refresh token") ||
              innerError.error === "invalid_grant")
          ) {
            console.log("Invalid refresh token detected, clearing auth state");
            clearAuthState();
            return false;
          }

          // For other errors, just return false
=======
        return false;
      } catch (innerError) {
        // If there's an error with the refresh token, we need to handle it
        console.error("Error with token refresh attempt:", innerError);
        
        // If this is an invalid refresh token, we need to log the user out and re-authenticate
        if (innerError.message && innerError.message.includes('Unknown or invalid refresh token')) {
          console.log("Invalid refresh token detected, user needs to login again");
          setIsAuthenticated(false); // Update local auth state
          
          // Clear any stored tokens to prevent further attempts with invalid tokens
          localStorage.removeItem("token");
          sessionStorage.removeItem("tokenRefreshedAt");
          
          // Optionally redirect to login or show login UI
>>>>>>> parent of 666ae3d (Use automated formatting tools)
          return false;
        }
        
        // For other errors, just return false
        return false;
      }
    } catch (error) {
      console.error("Error in refreshTokenAndRetry:", error);
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

<<<<<<< HEAD
    onMounted(async () => {
      // Set mounted first to prevent reactivity issues
      isMounted.value = true;

      // Wrap all auth logic in try-catch to prevent app crashes
      try {
        // Use a flag to prevent multiple refreshes on the same page load
        const hasRefreshedToken = sessionStorage.getItem("tokenRefreshedAt");
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
                cacheMode: "on", // Try to use cached token first
              });

              if (freshToken) {
                // Store the ID token in localStorage for Apollo client
                localStorage.setItem("token", idTokenClaims.value?.__raw || "");
                // Set the flag to prevent multiple refreshes
                sessionStorage.setItem("tokenRefreshedAt", now.toString());
                console.log("Token refreshed on page load");
              }
            } catch (tokenError) {
              // Handle token refresh errors gracefully
              console.log("Token refresh failed on mount:", tokenError);

              // Check for invalid grant specifically
              if (
                tokenError.error === "invalid_grant" ||
                (tokenError.message &&
                  tokenError.message.includes("Unknown or invalid refresh token"))
              ) {
                console.log("Invalid refresh token detected on mount, clearing auth state");
                clearAuthState();

                // Prevent further auth attempts in this session
                sessionStorage.setItem("authFailure", "true");
                return;
              }

              // For other token errors, just log and continue
              console.log("Non-critical token error, continuing without refresh");
            }
          } else if (idTokenClaims.value) {
            // Handle case for returning from a redirect
            try {
              const currentToken = localStorage.getItem("token");
              const newToken = idTokenClaims.value.__raw;

              if (currentToken !== newToken) {
                storeToken();
                // Set the flag to prevent multiple refreshes
                sessionStorage.setItem("tokenRefreshedAt", now.toString());
              }
            } catch (storeError) {
              console.error("Error storing token on redirect return:", storeError);
=======
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
          try {
            // First try with cacheMode: 'on' to use any existing valid tokens
            const freshToken = await getAccessTokenSilently({
              detailedResponse: true,
              cacheMode: 'on' // Try to use cached token first
            });
            
            if (freshToken) {
              // Store the ID token in localStorage for Apollo client
              localStorage.setItem("token", idTokenClaims.value?.__raw || '');
              // Set the flag to prevent multiple refreshes
              sessionStorage.setItem("tokenRefreshedAt", now.toString());
              console.log("Token refreshed on page load");
            }
          } catch (innerError) {
            // If using cached token fails, handle silently
            console.log("Could not use cached token, will try login redirect if needed", innerError);
            
            // If this is an invalid refresh token, we need to log the user out and re-authenticate
            if (innerError.message && innerError.message.includes('Unknown or invalid refresh token')) {
              console.log("Invalid refresh token, will need to reauthenticate");
              setIsAuthenticated(false); // Update local auth state
>>>>>>> parent of 666ae3d (Use automated formatting tools)
            }
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
<<<<<<< HEAD
      } catch (mountError) {
        console.error("Critical error in auth mount logic:", mountError);

        // Clear auth state on any critical error to prevent app crashes
        clearAuthState();

        // Set a flag to prevent infinite retry loops
        sessionStorage.setItem("authFailure", "true");
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      }
    } catch (error) {
      console.error("Error refreshing token on mount:", error);
      // If token refresh fails, don't crash but log it
    }
  });

<<<<<<< HEAD
    handleLogin = async () => {
      try {
        // Check if we had an auth failure this session
        const hadAuthFailure = sessionStorage.getItem("authFailure");
        if (hadAuthFailure) {
          // Clear the failure flag and try fresh
          sessionStorage.removeItem("authFailure");
          clearAuthState();
        }

        // Add debug statements for troubleshooting
        console.log("Login button clicked");

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // @ts-ignore
        if (window?.parent?.Cypress || isMobile) {
          // Make sure to return early after redirect to prevent additional actions
          console.log("Using redirect for Cypress or mobile");
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
        // Don't let login errors crash the app
=======
  handleLogin = async () => {
    try {
      // Add debug statements for troubleshooting
      console.log("Login button clicked");

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // @ts-ignore
      if (window?.parent?.Cypress || isMobile) {
        // Make sure to return early after redirect to prevent additional actions
        console.log("Using redirect for Cypress or mobile");
        await loginWithRedirect();
        return;
>>>>>>> parent of 666ae3d (Use automated formatting tools)
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
<<<<<<< HEAD

      <div class="w-full">
        <div
          v-if="!showAuthContent"
          data-auth-state="unauthenticated"
          @click="handleLogin"
        >
          <slot name="does-not-have-auth" />
        </div>
        <div
          v-else
          data-auth-state="authenticated"
        >
          <slot name="has-auth" />
        </div>
=======
      
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
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      </div>
    </client-only>
  </div>
</template>