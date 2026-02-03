<script setup lang="ts">
import { config } from '@/config';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { useRoute } from 'nuxt/app';
import { useAuth0 } from '@auth0/auth0-vue';
import { useSSRAuth } from '@/composables/useSSRAuth';

let handleLogout = () => {};
const { clearAuthHints } = useSSRAuth();

// Only initialize auth0 on client side
if (import.meta.env.SSR === false) {
  const { logout } = useAuth0();

  handleLogout = () => {
    try {

      const route = useRoute();
      // Store the current path in local storage
      localStorage.setItem('postLogoutRedirect', route.fullPath);

      // Create the full absolute URL for the logout redirect
      const baseUrl = config.baseUrl || window.location.origin;
      const logoutReturnUrl = `${baseUrl}/logout`;

      // Clear any Auth0 token from localStorage
      localStorage.removeItem('token');

      // Clear auth hint cookies
      clearAuthHints();

      // Logout and redirect
      logout({
        logoutParams: {
          returnTo: logoutReturnUrl,
          clientId: config.clientId,
        },
      });
    } catch (error) {
      console.error('Error during logout:', error);

      // Fallback: If logout fails, force redirect to home page
      window.location.href = '/';
    }
  };
}
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
