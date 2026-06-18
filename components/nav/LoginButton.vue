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
        class="font-semibold mr-2 inline-flex items-center rounded-full px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        @click="handleLogout"
      >
        Log Out
      </button>
    </template>
    <template #does-not-have-auth>
      <button
        data-testid="login-button"
        class="font-semibold mr-2 inline-flex items-center rounded-full px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        Log In
      </button>
    </template>
  </RequireAuth>
</template>
