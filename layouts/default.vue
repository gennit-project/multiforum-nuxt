<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import TopNav from "@/components/nav/TopNav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import FetchUserData from "@/components/auth/FetchUserData.vue";
import { usernameVar } from "@/cache";

const auth0user = ref();

const usernameLoaded = ref(false);

onMounted(() => {
  if (!import.meta.client) return;
  const { user } = useAuth0();
  console.log('user', user.value) 
  auth0user.value = user.value;
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

watch(
  () => usernameVar.value,
  (newUsername) => {
    usernameLoaded.value = !!newUsername;
  }
);
console.log('auth0 user', auth0user.value)
console.log('usernamevar', usernameVar.value)
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
              <FetchUserData v-if="auth0user.email" />
              <div v-if="auth0user?.email && usernameLoaded" >
                <div class="flex min-h-screen flex-col">
                  <div class="flex-grow">
                    <slot />
                  </div>
                  <SiteFooter v-if="showFooter" />
                </div>
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
