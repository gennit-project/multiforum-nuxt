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
  const { loginWithPopup, idTokenClaims, isLoading, loginWithRedirect, isAuthenticated } =
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

  // Watch for authentication state changes
  watch(idTokenClaims, async (claims) => {
    if (isAuthenticated.value && claims) {
      await storeToken();
    }
  });

  onMounted(() => {
    isMounted.value = true;
    // Also check on mount in case we're returning from a redirect
    if (isAuthenticated.value && idTokenClaims.value) {
      try {
        // Only store the token if it's different from what's already stored
        const currentToken = localStorage.getItem("token");
        const newToken = idTokenClaims.value.__raw;
        
        if (currentToken !== newToken) {
          storeToken();
        }
      } catch (error) {
        console.error("Error checking token on mount:", error);
      }
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