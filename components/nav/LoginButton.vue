<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
const { isAuthenticated, loginWithPopup } = useAuth0();
</script>

<template>
  <client-only>
    <button
      v-if="!isAuthenticated"
      data-testid="login-button"
      class="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-400 rounded-full hover:text-black hover:dark:text-white mr-2"
      @click="loginWithPopup"
    >
      Log In
    </button>
  </client-only>
</template>
