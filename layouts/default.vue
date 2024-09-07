<script setup lang="ts">
import { useAuth0 } from "@/hooks/useAuth0";
import TopNav from "@/components/nav/Topnav.vue";
import SiteSidenav from "@/components/nav/SiteSidenav.vue";
import WithAuth from "@/components/layout/WithAuth.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";
import { computed, ref } from "vue";
console.log("default.vue");

const { isAuthenticated, user, isLoading } = useAuth0();
const route = useRoute();

const showDropdown = ref(false);
const showUserProfileDropdown = ref(false);

const emailFromAuth0 = computed(() => {
  // The reason why we get the email in this parent
  // component is because we need to look up the username
  // by email. But we cannot call the query to get the
  // username from the email until the email exists,
  // and we can't lazily wait to do the query until
  // we have the email because the useAuth0 hook does
  // not have an "onResult" type of callback like Apollo does.
  // So to get around this limitation, we put that call
  // in the WithAuth component and just don't render that
  // component until we have the email.
  if (isAuthenticated && user.email) {
    return user.email;
  }
  return "";
});

const closeUserProfileDropdown = () => {
  showUserProfileDropdown.value = false;
};
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};
const toggleUserProfileDropdown = () => {
  showUserProfileDropdown.value = !showUserProfileDropdown.value;
};
</script>

<template>
  <v-app>
    <main>
      <div class="h-screen dark:text-gray-200 list-disc">
        <nav>
          <TopNav
            :show-user-profile-dropdown="showUserProfileDropdown"
            :side-nav-is-open="showDropdown"
            @toggle-dropdown="toggleDropdown"
            @close-user-profile-dropdown="closeUserProfileDropdown"
            @toggle-user-profile-dropdown="toggleUserProfileDropdown"
          />
        </nav>
        <div class="flex relative">
          <SiteSidenav
            :key="`${showDropdown}`"
            :show-dropdown="showDropdown"
            @close="showDropdown = false"
          />
          <div class="w-full">
            <div v-if="isLoading" class="flex justify-center">Loading...</div>
            <WithAuth
              v-else-if="emailFromAuth0"
              :email-from-auth0="emailFromAuth0"
            >
            <div class="flex min-h-screen flex-col">
              <div class="flex-grow">
                <slot/>
              </div>
              <SiteFooter
                v-if="
                  route.name &&
                  route.name !== 'MapView' &&
                  route.name !== 'MapEventPreview'
                "
              />
            </div>
            </WithAuth>
            <div v-else class="flex min-h-screen flex-col">
              <div class="flex-grow">
                <slot/>
              </div>
              <SiteFooter
                v-if="
                  route.name &&
                  route.name !== 'MapView' &&
                  route.name !== 'MapEventPreview'
                "
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  </v-app>
</template>
<style lang="scss">
body {
  @media (prefers-color-scheme: dark) {
    @apply bg-black;
    color-scheme: dark;
  }

  @media (prefers-color-scheme: light) {
    @apply bg-gray-100;
    color-scheme: light;
  }

  &.dark {
    @apply bg-black;
    color-scheme: dark;
  }

  &.light {
    @apply bg-gray-100;
    color-scheme: light;
  }
}
</style>
