<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
import config from "@/config";
import RequireAuth from "@/components/auth/RequireAuth.vue";
import { useRoute } from "vue-router";
console.log('login')

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
  <RequireAuth>
    <template #has-auth>
      <button
        data-testid="logout-button"
        class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-400 rounded-full hover:text-black hover:dark:text-white mr-2"
        @click="handleLogout"
      >
        Log Out
      </button>
    </template>
    <template #does-not-have-auth>
      <button
        data-testid="login-button"
        class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-400 rounded-full hover:text-black hover:dark:text-white mr-2"
      >
        Log In
      </button>
    </template>
  </RequireAuth>
</template>
