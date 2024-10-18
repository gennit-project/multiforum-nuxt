<script setup lang="ts">
import { ref } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { useAuth0 } from "@/hooks/useAuth0";
import { GET_EMAIL } from "@/graphQLData/email/queries";
import { usernameVar, modProfileNameVar } from "@/cache";
import type { User, ModerationProfile } from "@/__generated__/graphql";
import TopNav from "@/components/nav/TopNav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import CreateUsernamePage from "@/components/auth/CreateUsernamePage.vue";

const { user } = useAuth0();
usernameVar(user?.username);
modProfileNameVar(user?.ModerationProfile?.displayName || "");

const { onResult: onEmailResult } = useQuery(GET_EMAIL, {
  emailAddress: user?.email,
});

// Reactive variable to track if the email is not in the system
const emailNotInSystem = ref(false);

// Handle email query result
onEmailResult((result: any) => {
  if (!import.meta.client) return;
  let user: User | null = null;
  let username = "";
  let modProfileName = "";
  const emailData = result.data?.emails[0];

  user = emailData?.User;

  if (!user) {
    emailNotInSystem.value = true;
  } else {
    username = user.username;
    modProfileName = user.ModerationProfile?.displayName || "";

    if (username && username !== usernameVar()) {
      // Store the authenticated user's username in the app state
      usernameVar(username);
    }

    if (modProfileName && modProfileName !== modProfileNameVar()) {
      modProfileNameVar(modProfileName);
    }

    emailNotInSystem.value = false;
  }
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

const emailFromAuth0 = user.email; // emailResult.value?.emails[0]?.emailAddress;
const route = useRoute();
const showFooter = !route.name?.includes("map");
const { isLoading, error: emailError } = useAuth0();
const loggedInUser = computed(() => usernameVar());
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
        <div class="flex relative">
          <SiteSidenav
            :key="`${showDropdown}`"
            :show-dropdown="showDropdown"
            @close="showDropdown = false"
          />
          <div class="w-full">
            <div v-if="emailFromAuth0" :email-from-auth0="emailFromAuth0">
              <div v-if="isLoading">Loading...</div>
              <ErrorBanner v-else-if="emailError" :text="emailError?.message" />
              <div v-else-if="emailNotInSystem">
                <CreateUsernamePage
                  @email-and-user-created="emailNotInSystem = false"
                />
              </div>
              <div v-else :key="loggedInUser">
                <div class="flex min-h-screen flex-col">
                  <div class="flex-grow">
                    <client-only>
                      <slot />
                    </client-only>
                  </div>
                  <SiteFooter v-if="showFooter" />
                </div>
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
      </div>
    </main>
  </v-app>
</template>

<style lang="scss">
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}
body {
  @media (prefers-color-scheme: dark) {
    @apply bg-black;
    @apply text-white;
    color-scheme: dark;
  }

  @media (prefers-color-scheme: light) {
    @apply bg-gray-100;
    color-scheme: light;
  }

  &.dark {
    @apply bg-black;
    @apply text-white;
    color-scheme: dark;
  }

  &.light {
    @apply bg-gray-100;
    color-scheme: light;
  }
}
</style>
