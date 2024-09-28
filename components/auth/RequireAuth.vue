<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useAuth0 } from '@/hooks/useAuth0';
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { usernameVar } from "@/cache";

// Props definition using defineProps
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
  // loginWithPopup, 
  login,
  loginWithRedirect, 
  isLoading: authLoading, 
  isAuthenticated, 
  // idTokenClaims 
} = useAuth0();

// Function to store token in localStorage (client-side only)
const storeToken = async () => {
  if (isAuthenticated) {
    // const token = await idTokenClaims?.value?.__raw;
    // if (import.meta.client) {
    //   localStorage.setItem("token", token || "");
    // }
  }
};

// Login function that either uses Cypress for testing or shows a popup
const handleLogin = async () => {
  if (window.parent.Cypress) {
    await loginWithRedirect();
  } else {
    // await loginWithPopup();
    await login()
  }
  storeToken();
};

// Ensure token is stored on the client-side when mounted
onMounted(() => {
  if (import.meta.client) {
    storeToken();
  }
});
// Computed properties for username and ownership
const username = computed(() => {
  console.log('usernameVar()', usernameVar())
  return usernameVar()
});

const isOwner = computed(() => {
  return props.owners.includes(username.value);
});
</script>

<template>
  <LoadingSpinner v-if="loading || authLoading" />
  <div
    v-else
    class="flex align-middle"
    :class="[!justifyLeft ? 'justify-center' : '', fullWidth ? 'w-full' : '']"
  >
    <div
      v-if="username && (!requireOwnership || isOwner)"
      :class="[fullWidth ? 'w-full flex justify-center' :'w-full flex justify-end']"
    >
      <slot name="has-auth" />
    </div>
    <div
      v-else
      :class="[fullWidth ? 'w-full' : '']"
      @click="handleLogin"
    >
      <slot name="does-not-have-auth" />
    </div>
  </div>
</template>
