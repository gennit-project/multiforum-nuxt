<script setup lang="ts">
import { computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { isAuthenticatedVar, isLoadingAuthVar, usernameVar } from '@/cache';

const props = defineProps({
  requireOwnership: Boolean,
  owners: Array as () => string[],
  justifyLeft: Boolean,
  fullWidth: Boolean,
});

const { loginWithPopup, idTokenClaims } = useAuth0();

const storeToken = async () => {
  if (isAuthenticatedVar.value && idTokenClaims.value) {
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

const isOwner = computed(() => props.owners?.includes(usernameVar.value));
const showAuthContent = computed(() => isAuthenticatedVar.value && !!usernameVar.value);
</script>

<template>
  <LoadingSpinner v-if="isLoadingAuthVar" />
  <div
    v-else
    class="flex align-middle"
    :class="[!justifyLeft ? 'justify-center' : '', fullWidth ? 'w-full' : '']"
  >
    <div
      v-if="showAuthContent && (!requireOwnership || isOwner)"
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
