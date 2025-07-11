<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "nuxt/app";
import TopNav from "@/components/nav/Topnav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import DevOverlay from "@/components/nav/DevOverlay.vue";
import { config } from "@/config";
import { sideNavIsOpenVar, setSideNavIsOpenVar } from "@/cache";

// Composables for separated concerns
import { useAuthManager } from "@/composables/useAuthManager";
import { useTestAuthHelpers } from "@/composables/useTestAuthHelpers";

const isDevelopment = computed(() => config.environment === "development");
const route = useRoute();
const showFooter = !route.name?.toString().includes("map");

// UI state management
const showUserProfileDropdown = ref(false);
const toggleDropdown = () => setSideNavIsOpenVar(!sideNavIsOpenVar.value);
const toggleUserProfileDropdown = () =>
  (showUserProfileDropdown.value = !showUserProfileDropdown.value);
const closeUserProfileDropdown = () => (showUserProfileDropdown.value = false);

// Auth management via composable
const { isSessionExpired, loginWithRedirect } = useAuthManager();

// Test helpers (only in dev/test environments)
const shouldExposeTestHelpers =
  isDevelopment.value ||
  config.environment === "test" ||
  (typeof window !== "undefined" && (window as any).Cypress);

if (shouldExposeTestHelpers) {
  useTestAuthHelpers();
}

// Handle session expired login
const handleSessionExpiredLogin = () => {
  if (loginWithRedirect) {
    loginWithRedirect();
  }
};
</script>

<template>
  <v-app>
    <DevOverlay v-if="isDevelopment" />
    <main class="flex min-h-screen flex-col">
      <!-- Session expired banner -->
      <div
        v-if="isSessionExpired"
        class="bg-red-500 p-4 text-center text-white"
      >
        Your session has expired. Please
        <button
          class="font-bold underline hover:text-red-100"
          @click="handleSessionExpiredLogin"
        >
          click here to log in again
        </button>
      </div>

      <div
        class="flex flex-grow list-disc flex-col bg-gray-200 dark:bg-black dark:text-gray-200"
      >
        <TopNav
          :show-user-profile-dropdown="showUserProfileDropdown"
          :side-nav-is-open="sideNavIsOpenVar"
          @close-user-profile-dropdown="closeUserProfileDropdown"
          @toggle-dropdown="toggleDropdown"
          @toggle-user-profile-dropdown="toggleUserProfileDropdown"
        />

        <div class="relative flex flex-grow flex-col">
          <SiteSidenav
            :key="`${sideNavIsOpenVar}`"
            :show-dropdown="sideNavIsOpenVar"
            @close="setSideNavIsOpenVar(false)"
          />

          <div class="flex w-full flex-grow flex-col">
            <slot />
            <SiteFooter v-if="showFooter" class="mt-auto" />
          </div>
        </div>
      </div>
    </main>
  </v-app>
</template>
