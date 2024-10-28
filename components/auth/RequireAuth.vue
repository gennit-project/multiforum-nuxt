<script setup lang="ts">
import { computed, unref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { usernameVar } from "@/cache";

// Define Props
const props = defineProps({
  requireOwnership: {
    type: Boolean,
    default: false,
  },
  owners: {
    type: Array as () => string[],
    default: () => [],
  },
  justifyLeft: {
    type: Boolean,
    default: false,
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const { 
  loginWithPopup, 
  isAuthenticated, 
  idTokenClaims,
  isLoading: auth0isLoading,
} = useAuth0();

const storeToken = async () => {
  if (isAuthenticated.value && idTokenClaims.value) {
    const token = await idTokenClaims.value.__raw;
    localStorage.setItem("token", token);
  }
};

const handleLogin = async () => {
  if (import.meta.client) {
    await loginWithPopup();
    await storeToken();
  }
};

const isOwner = computed(() => props.owners.includes(usernameVar()));
</script>

<template>
  <LoadingSpinner v-if="loading || auth0isLoading" />
  <div
    v-else
    class="flex align-middle"
    :class="[!justifyLeft ? 'justify-center' : '', fullWidth ? 'w-full' : '']"
  >
    <div
      v-if="isAuthenticated && (!requireOwnership || isOwner)"
      :class="[
        fullWidth ? 'w-full flex justify-center' : 'w-full flex justify-end',
      ]"
    >
      <slot name="has-auth" />
    </div>
    <div v-else :class="[fullWidth ? 'w-full' : '']" @click="handleLogin">
      <slot name="does-not-have-auth" />
    </div>
  </div>
</template>
