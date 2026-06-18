<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue';
import { config } from '@/config';
import { isAuthenticatedVar } from '@/cache';
import { useRoute } from 'nuxt/app';

defineProps({
  navLinkClasses: {
    type: String,
    default: '',
  },
});

// SPIKE (auth0-nuxt migration): SSR can now be authenticated, so this renders
// server-side where @auth0/auth0-vue's useAuth0() is undefined. Guard it like
// LoginButton. (Phase 3 replaces this with a /auth/logout navigation.)
let logout: ReturnType<typeof useAuth0>['logout'] = () => Promise.resolve();
if (import.meta.env.SSR === false) {
  logout = useAuth0().logout;
}
const route = useRoute();

const handleLogout = () => {
  // Store the current path in local storage
  localStorage.setItem('postLogoutRedirect', route.fullPath);
  // Redirect to the fixed logout route
  logout({
    logoutParams: {
      returnTo: `${config.baseUrl}/logout`,
    },
  });
};
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
