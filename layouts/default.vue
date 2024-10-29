<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useLazyQuery } from "@vue/apollo-composable";
import TopNav from "@/components/nav/TopNav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { setUsername, usernameVar, isAuthenticatedVar, isLoadingAuthVar } from "@/cache";

// UI states
const showUserProfileDropdown = ref(false);
const showDropdown = ref(false);
const toggleDropdown = () => (showDropdown.value = !showDropdown.value);
const toggleUserProfileDropdown = () =>
  (showUserProfileDropdown.value = !showUserProfileDropdown.value);
const closeUserProfileDropdown = () => (showUserProfileDropdown.value = false);
const showFooter = !useRoute().name?.includes("map");

const userEmail = ref("");
// Lazy query to fetch user email data from GraphQL
const { load: loadUserData, onResult, onError } = useLazyQuery(GET_EMAIL, {
  emailAddress: userEmail,
});

onError((error) => {
  console.error("GraphQL query error:", error);
});

onMounted(() => {
  const { user, isAuthenticated } = useAuth0();
  isAuthenticatedVar.value = isAuthenticated;
  isLoadingAuthVar.value = false;

  watch(
    user,
    (user) => {
      if (user?.email) {
        userEmail.value = user.email;
        loadUserData();
      }
    },
    { immediate: true }
  );
});


// Set `username` in the cache upon GraphQL query result
onResult((newResult) => {
  const userData = newResult?.data?.emails?.[0]?.User;

  if (userData && !userData.loading) {
    setUsername(userData.username);
  }
});
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
              <div
                v-if="!isLoadingAuthVar && isAuthenticatedVar && usernameVar"
                class="flex min-h-screen flex-col"
              >
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
