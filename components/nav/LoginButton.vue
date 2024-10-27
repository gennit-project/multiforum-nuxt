<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
import config from "@/config";
const { isAuthenticated, loginWithPopup, logout } = useAuth0();
</script>

<template>
  <button
    v-if="!isAuthenticated"
    data-testid="login-button"
    class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-400 rounded-full hover:text-black hover:dark:text-white mr-2"
    @click="loginWithPopup"
  >
    Log In
  </button>
  <button
    v-else
    data-testid="logout-button"
    class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-400 rounded-full hover:text-black hover:dark:text-white mr-2"
    @click="logout({ returnTo: config.logoutUrl });"
  >
    Log Out
  </button>
</template>
