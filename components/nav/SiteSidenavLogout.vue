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
  showIconOnly: {
    type: Boolean,
    default: false,
  },
});

const { logout } = useAuth0();
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
