<script setup lang="ts">
import { computed } from "vue";
import HamburgerMenuButton from "@/components/nav/HamburgerMenuButton.vue";
import UserProfileDropdownMenu from "@/components/nav/UserProfileDropdownMenu.vue";
import ThemeSwitcher from "@/components/nav/ThemeSwitcher.vue";
import CreateAnythingButton from "@/components/nav/CreateAnythingButton.vue";
import LogoIcon from "@/components/icons/LogoIcon.vue";
import { useRoute } from "nuxt/app";
import LoginButton from "./LoginButton.vue";
import {
  modProfileNameVar,
  usernameVar,
  sideNavIsOpenVar,
  notificationCountVar,
} from "@/cache";

defineEmits(["toggleDropdown"]);

const route = useRoute();

const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);

const shouldShowChannelId = computed(() => channelId.value);

const routeInfoLabel = computed(() => {
  if (
    typeof route.name === "string" &&
    route.name.indexOf("map-search") !== -1
  ) {
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
  if (typeof route.name === "string" && route.name.includes("admin"))
    return "• admin dashboard";
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
    class="z-20 w-full bg-gray-900 border-b pr-4 border-b-gray-600"
    :class="[isOnMapPage ? 'fixed' : '']"
  >
    <div class="flex items-center justify-between px-2 py-1 lg:px-4">
      <div class="flex items-center">
        <HamburgerMenuButton
          v-if="!sideNavIsOpenVar"
          data-testid="menu-button"
          class="cursor-pointer fixed-menu-button md:ml-1"
          @click="$emit('toggleDropdown')"
        />

        <div class="ml-12 flex items-center space-x-1 text-sm">
          <nuxt-link to="/" class="flex items-center gap-1">
            <LogoIcon class="h-5 w-5" />
            <span class="font-bold text-white logo-font">Topical</span>
          </nuxt-link>

          <div
            v-if="shouldShowChannelId"
            class="hidden sm:flex items-center gap-1 text-gray-300"
          >
            <span>•</span>
            <nuxt-link
              :to="`/forums/${channelId}`"
              class="font-mono text-gray-300 hover:text-white"
            >
              {{ channelId }}
            </nuxt-link>
          </div>
          <div
            v-else-if="routeInfoLabel"
            class="hidden sm:flex items-center gap-1"
          >
            <span>•</span>
            {{ routeInfoLabel }}
          </div>
          <div v-else class="hidden sm:flex items-center gap-1">
            {{ getLabel() }}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="hidden sm:flex items-center justify-end space-x-2 md:flex-1"
        >
          <LoginButton />
        </div>
        <div class="flex items-center space-x-2 md:mr-2">
          <CreateAnythingButton :background-color="'dark'" />
          <nuxt-link
            data-testid="notification-bell"
            to="/notifications"
            sr-only="Notifications"
            class="text-gray-300 hover:text-white font-semibold relative inline-flex h-10 w-full items-center justify-center gap-x-1.5 rounded-full px-2 text-sm focus:outline-none"
          >
            <i class="fas fa-bell" />
            <span
              v-if="notificationCountVar > 0"
              class="absolute top-0 right-0 h-4 w-4 flex justify-center items-center px-1 text-xs font-semibold leading-none bg-red-500 rounded-full"
            >
              {{ notificationCountVar }}
            </span>
          </nuxt-link>
          <ThemeSwitcher />
          <div v-if="usernameVar" class="hidden lg:block">
            <div class="flex items-center">
              <div class="relative flex-shrink-0">
                <UserProfileDropdownMenu
                  :username="usernameVar"
                  :mod-name="modProfileNameVar"
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
