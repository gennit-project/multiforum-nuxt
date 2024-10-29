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
const {
  load: loadUserData,
  onResult,
} = useLazyQuery(GET_EMAIL, () => ({
  emailAddress: userEmail.value || "",
}));

/*

here are the requirements for the default layout.

1. auth0 code MUST be inside an onMounted hook because it cannot run on the server side.
2. because the email fetch must be in setup, it is not in the onMounted hook. we can call it lazily after the email is retrieved from auth0.
3. after the graphql query is done we must set the username on the cache with setUsername.
*/

onMounted(() => {
  const { user, isAuthenticated } = useAuth0();
  isAuthenticatedVar.value = isAuthenticated;
  isLoadingAuthVar.value = false;
  userEmail.value = user?.email || "";
  
  // Make sure that loadUserData is called AFTER email is retrieved from auth0
  watch(userEmail, () => {
    loadUserData();
  });
});

onResult((newResult) => {
  if (newResult?.data?.emails[0]?.User) {
    const user = newResult.data.emails[0].User;
    setUsername(user.username);
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
