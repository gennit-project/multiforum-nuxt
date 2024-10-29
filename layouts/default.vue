<script setup lang="ts">
import { ref, onMounted, watchEffect, computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import TopNav from "@/components/nav/TopNav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { setUsername, setModProfileName, usernameVar, isAuthenticatedVar, isLoadingAuthVar } from "@/cache";

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

onMounted(() => {
  console.log("Default layout mounted");

  if (import.meta.client) {
    const { isAuthenticated: auth0Authenticated, isLoading: auth0Loading, user } = useAuth0();

    // Update Auth0 loading status in cache
    watchEffect(() => {
      isLoadingAuthVar.value = auth0Loading.value;
      isAuthenticatedVar.value = auth0Authenticated.value;
    });

    // Load user data only when Auth0 is authenticated and ready
    watchEffect(() => {
      if (!auth0Loading.value && auth0Authenticated.value && user.value?.email) {
        const { onResult } = useQuery(GET_EMAIL, {
          emailAddress: user.value.email,
        });

        onResult((result: any) => {
          console.log('on email result', result);
          const emailData = result.data?.emails[0];
          const userData = emailData?.User;
          console.log("User data loaded:", userData);

          if (userData) {
            setUsername(userData.username);
            setModProfileName(userData.ModerationProfile?.displayName || "");
          }
        });
      }
    });
  } else {
    // On server side, assume unauthenticated
    isAuthenticatedVar.value = false;
    isLoadingAuthVar.value = false;
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
              <!-- Conditionally show content based on auth state -->
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
