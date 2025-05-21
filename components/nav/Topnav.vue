<script setup lang="ts">
  import { computed } from "vue";
  import HamburgerMenuButton from "@/components/nav/HamburgerMenuButton.vue";
  import UserProfileDropdownMenu from "@/components/nav/UserProfileDropdownMenu.vue";
  import ThemeSwitcher from "@/components/nav/ThemeSwitcher.vue";
  import CreateAnythingButton from "@/components/nav/CreateAnythingButton.vue";
  import LogoIcon from "@/components/icons/LogoIcon.vue";
  import { useRoute } from "nuxt/app";
  import LoginButton from "./LoginButton.vue";
  import { modProfileNameVar, usernameVar, sideNavIsOpenVar, notificationCountVar } from "@/cache";

  defineEmits(["toggleDropdown"]);

  const route = useRoute();

  const channelId = computed(() =>
    typeof route.params.forumId === "string" ? route.params.forumId : ""
  );

  const shouldShowChannelId = computed(() => channelId.value);

  const routeInfoLabel = computed(() => {
    if (typeof route.name === "string" && route.name.indexOf("map-search") !== -1) {
      return "in-person events";
    }

    switch (route.name) {
      case "discussions":
        return "discussions";
      case "events-list-search":
        return "online events";
      case "forums":
        return "forums";
      default:
        return "";
    }
  });

  function getLabel() {
    if (route.name === "SitewideSearchDiscussionPreview") return "• discussions";
    if (route.name === "SearchEventsList") return "• online events";
    if (route.name === "MapEventPreview") return "• in-person events";
    if (typeof route.name === "string" && route.name.includes("admin")) return "• admin dashboard";
    return "";
  }

  const isOnMapPage = computed(() => {
    if (route.name && typeof route.name === "string") {
      return route.name.includes("map");
    }
    return false;
  });
</script>

<template>
  <nav
    class="z-20 w-full border-b border-b-gray-600 bg-gray-900 pr-4"
    :class="[isOnMapPage ? 'fixed' : '']"
  >
    <div class="flex items-center justify-between px-2 py-1 lg:px-4">
      <div class="flex items-center">
        <HamburgerMenuButton
          v-if="!sideNavIsOpenVar"
          class="fixed-menu-button cursor-pointer md:ml-1"
          data-testid="menu-button"
          @click="$emit('toggleDropdown')"
        />

        <div class="ml-12 flex items-center space-x-1 text-sm">
          <nuxt-link
            class="flex items-center gap-1"
            to="/"
          >
            <LogoIcon class="h-5 w-5" />
            <span class="logo-font font-bold text-white">Topical</span>
          </nuxt-link>

          <div
            v-if="shouldShowChannelId"
            class="hidden items-center gap-1 text-gray-300 sm:flex"
          >
            <span>•</span>
            <nuxt-link
              class="font-mono text-gray-300 hover:text-white"
              :to="`/forums/${channelId}`"
            >
              {{ channelId }}
            </nuxt-link>
          </div>
          <div
            v-else-if="routeInfoLabel"
            class="hidden items-center gap-1 sm:flex"
          >
            <span>•</span>
            {{ routeInfoLabel }}
          </div>
          <div
            v-else
            class="hidden items-center gap-1 sm:flex"
          >
            {{ getLabel() }}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="hidden items-center justify-end space-x-2 sm:flex md:flex-1">
          <LoginButton />
        </div>
        <div class="flex items-center space-x-2 md:mr-2">
          <CreateAnythingButton :background-color="'dark'" />
          <nuxt-link
            class="font-semibold relative inline-flex h-10 w-full items-center justify-center gap-x-1.5 rounded-full px-2 text-sm text-gray-300 hover:text-white focus:outline-none"
            data-testid="notification-bell"
            sr-only="Notifications"
            to="/notifications"
          >
            <i class="fas fa-bell" />
            <span
              v-if="notificationCountVar > 0"
              class="font-semibold absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 px-1 text-xs leading-none"
            >
              {{ notificationCountVar }}
            </span>
          </nuxt-link>
          <ThemeSwitcher />
          <div
            v-if="usernameVar"
            class="hidden lg:block"
          >
            <div class="flex items-center">
              <div class="relative flex-shrink-0">
                <UserProfileDropdownMenu
                  :mod-name="modProfileNameVar"
                  :username="usernameVar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
  .fixed-menu-button {
    position: fixed; /* Makes the button stay in the same place on the screen */
    top: 6px; /* Distance from the top of the viewport */
    left: 10px; /* Distance from the left of the viewport */
    z-index: 19; /* Ensures the button is above other content */
  }
</style>
