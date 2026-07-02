<script setup lang="ts">
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useServerLogout } from '@/composables/useServerLogout';

// SPIKE Phase 3: logout goes through the server-session route, not the SPA SDK.
const { logout: handleLogout } = useServerLogout();
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <button
        data-testid="logout-button"
        class="mr-2 inline-flex items-center rounded-full px-1 py-1 text-base leading-none font-medium tracking-[-0.02em] text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
        @click="handleLogout"
      >
        Log Out
      </button>
    </template>
    <template #does-not-have-auth>
      <button
        data-testid="login-button"
        class="mr-2 inline-flex items-center rounded-full px-1 py-1 text-base leading-none font-medium tracking-[-0.02em] text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
      >
        Log In
      </button>
    </template>
  </RequireAuth>
</template>
