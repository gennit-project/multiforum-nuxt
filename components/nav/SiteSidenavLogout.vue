<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
import { config } from "@/config";
import { isAuthenticatedVar } from "@/cache";
import { useRoute } from "nuxt/app";

defineProps({
  navLinkClasses: {
    type: String,
    default: "",
  },
});

const { logout } = useAuth0();
const route = useRoute();

const handleLogout = () => {
  // Store the current path in local storage
  localStorage.setItem("postLogoutRedirect", route.fullPath);
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
