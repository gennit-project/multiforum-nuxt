<script setup lang="ts">
import { computed } from 'vue';
import { useIsAuthenticated, useUsername } from '@/composables/useAuthState';
import { useAuthNavigation } from '@/composables/useAuthNavigation';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const isAuthenticatedVar = useIsAuthenticated();
const usernameVar = useUsername();
const { getLoginUrl } = useAuthNavigation();

/*
Wrapper around content that requires authentication: renders the `has-auth`
slot when the user is authenticated, otherwise the `does-not-have-auth` slot
(whose wrapper click starts login).

Auth state (isAuthenticatedVar / usernameVar) is seeded from the encrypted
server session by plugins/auth-session.ts and travels through the Nuxt payload,
so it is identical on the server and the client's first hydration render — this
component can read it directly with no hydration mismatch, no isMounted dance,
and no auth-hint cookie shim. Login goes through the server-session route
(/auth/login); logout is handled by composables/useServerLogout.
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

const isOwner = computed(() => {
  if (!usernameVar.value) return false;
  return props.owners?.includes(usernameVar.value);
});

// Ownership is decided by data the page is still loading (e.g. the discussion
// author). Until it arrives the owner list is empty, so without this a signed-in
// owner briefly sees the does-not-have-auth slot ("no permission").
const checkingOwnership = computed(
  () => props.loading && props.requireOwnership && isAuthenticatedVar.value
);

const showAuthContent = computed(() => {
  if (!isAuthenticatedVar.value) {
    return false;
  }
  if (props.requireOwnership) {
    return isOwner.value;
  }
  return true;
});

const handleLogin = () => {
  if (typeof window === 'undefined') return;
  const returnTo = window.location.pathname + window.location.search;
  window.location.href = getLoginUrl(returnTo);
};
</script>

<template>
  <div
    class="flex items-center"
    :class="[
      fullWidth ? 'w-full' : '',
      justifyLeft ? 'w-full justify-start' : 'justify-center',
    ]"
  >
    <div class="w-full">
      <div
        v-if="checkingOwnership"
        class="flex w-full justify-center p-8"
        data-auth-state="checking"
      >
        <LoadingSpinner label="Checking permissions…" />
      </div>
      <!-- Always render content immediately for SEO, no loading states -->
      <div
        v-else-if="!showAuthContent"
        class="w-full"
        data-auth-state="unauthenticated"
        @click="handleLogin"
      >
        <slot name="does-not-have-auth" />
      </div>
      <div v-else class="w-full" data-auth-state="authenticated">
        <slot name="has-auth" />
      </div>
    </div>
  </div>
</template>
