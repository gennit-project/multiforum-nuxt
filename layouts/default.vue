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

// Auth and user data states
const isAuthenticated = ref(false);
const isLoadingAuth = ref(true);
const userEmail = ref("");

// Lazy query to fetch user email data from GraphQL
const { load: loadUserData, result, error } = useLazyQuery(GET_EMAIL, () => ({
  emailAddress: userEmail.value || "",
}));

// Watch for query results and set the username in the cache when the query completes
watch(
  result,
  (queryResult) => {
    const userData = queryResult?.data?.emails?.[0]?.User;
    if (userData) {
      setUsername(userData.username);  // Cache the username once the query completes
      console.log("Username set in cache:", userData.username);
    }
  }
);

// Initialize Auth0 inside onMounted to ensure client-side execution only
onMounted(() => {
  console.log("Initializing Auth0 on client-side");
  const { isAuthenticated: auth0Authenticated, isLoading: auth0Loading, user } = useAuth0();

  watch(
    [auth0Loading, auth0Authenticated, user],
    ([loading, authenticated, userInfo]) => {
      isAuthenticated.value = authenticated;
      isLoadingAuth.value = loading;
      userEmail.value = userInfo?.email || ""; // Set user email once available from Auth0

      // Update cache variables
      isAuthenticatedVar.value = authenticated;
      isLoadingAuthVar.value = loading;

      // Call the GraphQL query lazily once the email is retrieved
      if (userEmail.value) {
        console.log("User email retrieved from Auth0:", userEmail.value);
        loadUserData();
      }
    }
  );
});

// Watch for any GraphQL query errors
watch(
  error,
  (errorValue) => {
    if (errorValue) {
      console.error("Error fetching user data:", errorValue);
    }
  }
);
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
