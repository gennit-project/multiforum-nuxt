<script setup lang="ts">
import { computed, watch, onMounted, ref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { isAuthenticatedVar, setIsLoadingAuth, usernameVar } from "@/cache";

/* 
This component is a wrapper around content that requires authentication.
It shows the content if the user is authenticated, and a login button 
if they’re not.

It also has logic to prevent hydration errors and content shift.
It works like this:

SSR: We cannot know if the user is logged in. So we pretend they’re not.

Client Initial Hydration: We also pretend they’re not logged in, 
matching the SSR output. (No mismatch!)

Client After Mount: We check usernameVar.value. If it’s non-empty,
 we flip to the “has-auth” content. That causes a normal Vue re-render, 
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
  // If not mounted yet, pretend not authenticated
  if (!isMounted.value) return false;

  // If user not logged in or no username, false
  if (!usernameVar.value) return false;

  // If requireOwnership is true, ensure user isOwner
  if (props.requireOwnership && !isOwner.value) return false;

  return true;
});

if (import.meta.env.SSR === false) {
  const { loginWithPopup, idTokenClaims, isLoading, loginWithRedirect } =
    useAuth0();

  setIsLoadingAuth(isLoading.value);

  const storeToken = async () => {
    if (isAuthenticatedVar.value && idTokenClaims.value) {
      const token = await idTokenClaims.value.__raw;
      localStorage.setItem("token", token);
    }
  };

  // Watch for authentication state changes
  watch([isAuthenticatedVar, idTokenClaims], async ([isAuth, claims]) => {
    if (isAuth && claims) {
      await storeToken();
    }
  });

  onMounted(() => {
    isMounted.value = true;
    // // Also check on mount in case we're returning from a redirect
    if (isAuthenticatedVar.value && idTokenClaims.value) {
      // Only store the token if it's different from what's already stored

      if (localStorage.getItem("token") !== idTokenClaims.value.__raw) {
        storeToken();
      }
    }
  });

  handleLogin = async () => {
    // ts-ignore because Cypress is not defined in the browser
    // @ts-ignore
    if (window?.parent?.Cypress) {
      await loginWithRedirect();
    } else {
      await loginWithPopup();
      await storeToken();
    }
  };
}
</script>

<template>
  <div
    class="flex align-items"
    :class="[!justifyLeft ? 'justify-center' : '', fullWidth ? 'w-full' : '']"
  >
    <div v-if="!isMounted" class="...">
      <slot name="loading" />
    </div>
    <div
      v-else-if="!showAuthContent"
      :class="[
        fullWidth
          ? 'w-full flex align-items justify-center'
          : 'w-full flex align-items justify-end',
      ]"
      data-auth-state="unauthenticated"
      @click="handleLogin"
    >
      <slot name="does-not-have-auth" />
    </div>
    <div
      v-else
      :class="[
        fullWidth
          ? 'w-full flex align-items justify-center'
          : 'w-full flex align-items justify-end',
      ]"
      data-auth-state="authenticated"
    >
      <slot name="has-auth" />
    </div>
  </div>
</template>
