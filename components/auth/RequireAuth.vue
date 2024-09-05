<script setup lang="ts">
import { onMounted, computed } from "vue";
import { GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import { useAuth0 } from '@/hooks/useAuth0';
import LoadingSpinner from "@/components/LoadingSpinner.vue";

console.log("RequireAuth.vue"); 

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
const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);

const { 
  // loginWithPopup, 
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
const login = async () => {
  if (window.parent.Cypress) {
    await loginWithRedirect();
  } else {
    // await loginWithPopup();
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
  if (!localUsernameResult.value) {
    return "";
  }
  return localUsernameResult.value.username || "";
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
      class="w-full flex justify-center"
    >
      <slot name="has-auth" />
    </div>
    <div
      v-else
      :class="[fullWidth ? 'w-full' : '']"
      @click="login"
    >
      <slot name="does-not-have-auth" />
    </div>
  </div>
</template>
