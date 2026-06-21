<script setup lang="ts">
import { useIsAuthenticated } from '@/composables/useAuthState';
import { useServerLogout } from '@/composables/useServerLogout';

const isAuthenticatedVar = useIsAuthenticated();

defineProps({
  navLinkClasses: {
    type: String,
    default: '',
  },
});

// SPIKE Phase 3: logout goes through the server-session route, not the SPA SDK.
const { logout: handleLogout } = useServerLogout();
</script>

<template>
  <nuxt-link
    v-if="isAuthenticatedVar"
    data-testid="sign-out-link"
    to="/"
    :class="navLinkClasses"
    @click="handleLogout"
  >
    Sign Out
  </nuxt-link>
</template>
