<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
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

// Ref variables for auth0 (only needed client-side)
const loginWithPopupRef = ref();
const loginWithRedirectRef = ref();
const isAuthenticatedRef = ref(false);
const idTokenClaimsRef = ref();
const authLoadingRef = ref(false);

const storeToken = async () => {
  if (isAuthenticatedRef.value && idTokenClaimsRef.value) {
    const token = await idTokenClaimsRef.value.__raw;
    localStorage.setItem("token", token);
  }
};

const handleLogin = async () => {
  if (import.meta.client && loginWithPopupRef.value) {
    await loginWithPopupRef.value();
    await storeToken();
  }
};

onMounted(() => {
  if (import.meta.client) {
    // Client-only code for Auth0
    const {
      loginWithPopup,
      loginWithRedirect,
      isLoading: authLoading,
      isAuthenticated,
      idTokenClaims,
    } = useAuth0();

    // Assign to refs
    loginWithPopupRef.value = loginWithPopup;
    loginWithRedirectRef.value = loginWithRedirect;
    isAuthenticatedRef.value = isAuthenticated.value;
    authLoadingRef.value = authLoading.value;
    idTokenClaimsRef.value = idTokenClaims.value;

    storeToken();
  }
});

// Computed properties for username and ownership check
const username = computed(() => usernameVar());
const isOwner = computed(() => props.owners.includes(username.value));
</script>

<template>
  <LoadingSpinner v-if="loading || authLoadingRef" />
  <div
    v-else
    class="flex align-middle"
    :class="[!justifyLeft ? 'justify-center' : '', fullWidth ? 'w-full' : '']"
  >
    <div
      v-if="username && (!requireOwnership || isOwner)"
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
