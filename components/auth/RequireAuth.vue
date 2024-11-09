<script setup lang="ts">
import { computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { isAuthenticatedVar, usernameVar } from "@/cache";

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

const authIsLoading = ref(true);
const showAuthContent = computed(
  () => isAuthenticatedVar.value && !!usernameVar.value
);
const isOwner = computed(() => props.owners?.includes(usernameVar.value));

if (import.meta.env.SSR === false) {
  const { loginWithPopup, idTokenClaims, isLoading } = useAuth0();
  authIsLoading.value = isLoading.value

  const storeToken = async () => {
    if (isAuthenticatedVar.value && idTokenClaims.value) {
      const token = await idTokenClaims.value.__raw;
      localStorage.setItem("token", token);
    }
  };
  handleLogin = async () => {
    await loginWithPopup();
    await storeToken();
  };
}
</script>

<template>
  <LoadingSpinner v-if="loading || authIsLoading" />
  <div
    v-else
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
      <slot name="has-auth" />
    </div>
    <div
      v-else
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
