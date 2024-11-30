<script setup lang="ts">
import { computed, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import {
  isAuthenticatedVar,
  isLoadingAuthVar,
  setIsLoadingAuth,
  usernameVar,
} from "@/cache";
import { client } from "process";

// Define props for the component
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

const showAuthContent = computed(
  () => isAuthenticatedVar.value && usernameVar.value
);
const isOwner = computed(() => props.owners?.includes(usernameVar.value));

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

  // // Also check on mount in case we're returning from a redirect
  onMounted(async () => {
    if (isAuthenticatedVar.value && idTokenClaims.value) {
      // Only store the token if it's different from what's already stored

      if (localStorage.getItem("token") !== idTokenClaims.value.__raw) {
        await storeToken();
      }
    }
  });

  handleLogin = async () => {
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
    <div
      v-if="showAuthContent && (!requireOwnership || isOwner)"
      :class="[
        fullWidth
          ? 'w-full flex align-items justify-center'
          : 'w-full flex align-items justify-end',
      ]"
    >
      <client-only>
        <slot name="has-auth" />
      </client-only>
    </div>
    <div
      v-else-if="!isLoadingAuthVar"
      :class="[
        fullWidth
          ? 'w-full flex align-items justify-center '
          : 'w-full flex align-items justify-end',
      ]"
      @click="handleLogin"
    >
      <slot name="does-not-have-auth" />
    </div>
  </div>
</template>
