<script lang="ts">
import { defineComponent } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";

export default defineComponent({
  setup() {
    const { loginWithRedirect, user, isAuthenticated, isLoading } = useAuth0();

    return {
      login: () => {
        loginWithRedirect();
      },
      user,
      isAuthenticated,
      isLoading,
    };
  },
});
</script>

<template>
  <button
    id="user-menu-button"
    type="button"
    class="
      bg-gray-800
      rounded-full
      flex
      text-sm text-white
      focus:outline-none
      focus:ring-2
      focus:ring-offset-2
      focus:ring-offset-gray-800
      focus:ring-white
    "
    aria-expanded="false"
    aria-haspopup="true"
  >
    <span class="sr-only">Open user menu</span>
  </button>
</template>
