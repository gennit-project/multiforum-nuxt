<script setup lang="ts">
import { isAuthenticatedVar } from '@/cache';
import { useServerLogout } from '@/composables/useServerLogout';

defineProps({
  navLinkClasses: {
    type: String,
    default: '',
  },
  showIconOnly: {
    type: Boolean,
    default: false,
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
    <svg
      v-if="showIconOnly"
      class="h-6 w-6 text-gray-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
      />
    </svg>
    <span v-else>Sign Out</span>
  </nuxt-link>
</template>
