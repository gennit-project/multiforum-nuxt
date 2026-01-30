<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { useDisplay } from 'vuetify';
import TopNav from '@/components/nav/TopNav.vue';
import SiteSidenav from '@/components/nav/SiteSidenav.vue';
import VerticalIconNav from '@/components/nav/VerticalIconNav.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import DevOverlay from '@/components/nav/DevOverlay.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import AddToListModalHost from '@/components/collection/AddToListModalHost.vue';
import { config } from '@/config';
import {
  sideNavIsOpenVar,
  setSideNavIsOpenVar,
  isAuthenticatedVar,
} from '@/cache';

// Composables for separated concerns
import { useAuthManager } from '@/composables/useAuthManager';
import { useTestAuthHelpers } from '@/composables/useTestAuthHelpers';

const isDevRuntime = import.meta.env.DEV;
const isDevelopment = computed(() => config.environment === 'development');
const route = useRoute();
const showFooter = !route.name?.toString().includes('map');

// Responsive display
const { lgAndUp, mdAndUp } = useDisplay();

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
  isDevRuntime ||
  config.environment === 'test' ||
  (typeof window !== 'undefined' && (window as any).Cypress);

if (shouldExposeTestHelpers) {
  useTestAuthHelpers();
}

// Handle session expired login
const handleSessionExpiredLogin = () => {
  if (loginWithRedirect && isAuthenticatedVar.value) {
    loginWithRedirect();
  }
};
</script>

<template>
  <v-app>
    <DevOverlay v-if="isDevelopment" />
    <ToastNotification />
    <AddToListModalHost />
    <main class="flex min-h-screen flex-col">
      <!-- Session expired banner -->
      <div
        v-if="isSessionExpired && isAuthenticatedVar"
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
          <!-- Vertical Icon Navigation for Large Screens -->
          <ClientOnly>
            <VerticalIconNav />
            <template #fallback>
              <div
                class="hidden h-full w-20 lg:block"
                aria-hidden="true"
              />
            </template>
          </ClientOnly>

          <!-- Mobile/Tablet Side Navigation -->
          <SiteSidenav
            v-if="!lgAndUp"
            :key="`${sideNavIsOpenVar}`"
            :show-dropdown="sideNavIsOpenVar"
            @close="setSideNavIsOpenVar(false)"
          />

          <div
            class="flex min-w-0 flex-1 flex-col bg-white dark:bg-black lg:pl-20"
          >
            <slot />
          </div>
          <ClientOnly>
            <SiteFooter
              v-if="showFooter"
              class="mt-auto"
              :class="{ 'pl-16': mdAndUp }"
            />
            <template #fallback>
              <SiteFooter v-if="showFooter" class="mt-auto" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </main>
  </v-app>
</template>
