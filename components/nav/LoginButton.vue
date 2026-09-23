<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useAuthNavigation } from '@/composables/useAuthNavigation';
import { useServerLogout } from '@/composables/useServerLogout';

// SPIKE Phase 3: logout goes through the server-session route, not the SPA SDK.
const { logout: handleLogout } = useServerLogout();
const route = useRoute();
const { getLoginUrl } = useAuthNavigation();

// Use a native link so login remains available before (or without) hydration.
// Fragments are browser-only and should not be sent through the server callback.
const loginUrl = computed(() =>
  getLoginUrl(route.fullPath.split('#', 1)[0] || '/')
);
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <button
        type="button"
        data-testid="logout-button"
        class="mr-2 inline-flex cursor-pointer items-center rounded-full px-1 py-1 text-base leading-none font-medium tracking-[-0.02em] text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
        @click="handleLogout"
      >
        Log Out
      </button>
    </template>
    <template #does-not-have-auth>
      <a
        :href="loginUrl"
        data-testid="login-button"
        class="mr-2 inline-flex cursor-pointer items-center rounded-full px-1 py-1 text-base leading-none font-medium tracking-[-0.02em] text-gray-700 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
        @click.stop
      >
        Log In
      </a>
    </template>
  </RequireAuth>
</template>
