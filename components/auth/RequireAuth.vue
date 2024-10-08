<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useAuth0 } from '@/hooks/useAuth0';
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

// Apollo authentication
const { 
  login, 
  // loginWithRedirect, 
  isLoading: authLoading, 
  isAuthenticated 
} = useAuth0();

const storeToken = async () => {
  if (isAuthenticated) {
    // Store token logic here
  }
};
const handleLogin = async () => {
  await login();
  storeToken();
};

onMounted(() => {
  if (import.meta.client) {
    storeToken();
  }
});

const username = computed(() => usernameVar());

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
