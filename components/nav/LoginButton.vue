<script setup lang="ts">
  import { config } from "@/config";
  import RequireAuth from "@/components/auth/RequireAuth.vue";
  import { useRoute } from "nuxt/app";
  import { useAuth0 } from "@auth0/auth0-vue";

  let handleLogout = () => {};

  // Only initialize auth0 on client side
  if (import.meta.env.SSR === false) {
    const { logout } = useAuth0();

    handleLogout = () => {
      try {
        console.log("Logout initiated");

        const route = useRoute();
        // Store the current path in local storage
        localStorage.setItem("postLogoutRedirect", route.fullPath);

        // Create the full absolute URL for the logout redirect
        const baseUrl = config.baseUrl || window.location.origin;
        const logoutReturnUrl = `${baseUrl}/logout`;
        console.log("Logout return URL:", logoutReturnUrl);

        // Clear any Auth0 token from localStorage
        localStorage.removeItem("token");

        // Logout and redirect
        logout({
          logoutParams: {
            returnTo: logoutReturnUrl,
            clientId: config.clientId,
          },
        });
      } catch (error) {
        console.error("Error during logout:", error);

        // Fallback: If logout fails, force redirect to home page
        window.location.href = "/";
      }
    };
  }
</script>

<template>
  <RequireAuth>
    <template #has-auth>
      <button
        class="mr-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-gray-300 hover:text-white"
        data-testid="logout-button"
        @click="handleLogout"
      >
        Log Out
      </button>
    </template>
    <template #does-not-have-auth>
      <button
        class="mr-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-gray-400 hover:text-black hover:dark:text-white"
        data-testid="login-button"
      >
        Log In
      </button>
    </template>
  </RequireAuth>
</template>
