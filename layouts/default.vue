<script setup lang="ts">
import { ref, onMounted } from "vue";
import TopNav from "@/components/nav/TopNav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import { useAuthStatus } from '@/composables/useAuthStatus';
import { setIsAuthenticated, setIsLoadingAuth, usernameVar, isAuthenticatedVar, isLoadingAuthVar } from '@/cache';

const { loadUserData } = useAuthStatus();

// Initialize loading and authentication status when component mounts
onMounted(async () => {
  console.log('Default layout mounted');
  setIsLoadingAuth(true);
  await loadUserData();
  setIsAuthenticated(isAuthenticatedVar.value); // Sets based on actual auth status
  setIsLoadingAuth(false);
});

const showUserProfileDropdown = ref(false);
const showDropdown = ref(false);

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const closeUserProfileDropdown = () => {
  showUserProfileDropdown.value = false;
};

const toggleUserProfileDropdown = () => {
  showUserProfileDropdown.value = !showUserProfileDropdown.value;
};

const route = useRoute();
const showFooter = !route.name?.includes("map");
</script>

<template>
  <v-app>
    <main>
      <div class="bg-gray-100 dark:bg-black dark:text-gray-200 list-disc">
        <TopNav
          :show-user-profile-dropdown="showUserProfileDropdown"
          :side-nav-is-open="showDropdown"
          @toggle-dropdown="toggleDropdown"
          @close-user-profile-dropdown="closeUserProfileDropdown"
          @toggle-user-profile-dropdown="toggleUserProfileDropdown"
        />
        <client-only>
          <div class="flex relative">
            <SiteSidenav
              :key="`${showDropdown}`"
              :show-dropdown="showDropdown"
              @close="showDropdown = false"
            />
            <div class="w-full">
              <div v-if="!isLoadingAuthVar && isAuthenticatedVar && usernameVar" class="flex min-h-screen flex-col">
                <div class="flex-grow">
                  <slot />
                </div>
                <SiteFooter v-if="showFooter" />
              </div>
              <div v-else class="flex min-h-screen flex-col">
                <div class="flex-grow">
                  <slot />
                </div>
                <SiteFooter v-if="showFooter" />
              </div>
            </div>
          </div>
        </client-only>
      </div>
    </main>
  </v-app>
</template>
