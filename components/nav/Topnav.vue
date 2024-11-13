<script setup lang="ts">
import { computed, ref } from "vue";
import HamburgerMenuButton from "@/components/nav/MenuButton.vue";
import UserProfileDropdownMenu from "@/components/nav/UserProfileDropdownMenu.vue";
import ThemeSwitcher from "@/components/nav/ThemeSwitcher.vue";
import CreateAnythingButton from "@/components/nav/CreateAnythingButton.vue";
import ArrowUpBoldBox from "vue-material-design-icons/ArrowUpBoldBox.vue";
import { useRoute } from "vue-router";
import LoginButton from "./LoginButton.vue";
import { modProfileNameVar, usernameVar } from "@/cache";

defineEmits(["toggleDropdown"]);

const route = useRoute();

const channelId = computed(() =>
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);
const sideNavIsOpen = ref(false);
const shouldShowChannelId = computed(() => channelId.value);

const routeInfoLabel = computed(() => {
  if (typeof route.name === 'string' && route.name.indexOf("map-search") !== -1) {
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
    class="z-20 w-full bg-gray-100 border-b dark:bg-gray-900"
    :class="[isOnMapPage ? 'fixed' : '']"
  >
    <div class="flex items-center justify-between px-2 py-2 lg:px-4 lg:py-1">
      <div class="flex items-center">
        <HamburgerMenuButton
          v-if="!sideNavIsOpen"
          data-testid="menu-button"
          class="cursor-pointer fixed-menu-button"
          @click="$emit('toggleDropdown')"
        />

        <div class="ml-12 flex items-center space-x-1 text-sm">
          <nuxt-link to="/" class="flex items-center gap-2">
            <ArrowUpBoldBox :size="38" class="text-blue dark:text-blue-500" />
            <span class="font-bold dark:text-white">Topical</span>
            <div
              class="text-xs py-0.5 px-1 border border-blue-500 text-blue-500 rounded-md"
            >
              ALPHA
            </div>
          </nuxt-link>

          <div
            v-if="shouldShowChannelId"
            class="hidden sm:flex items-center gap-1"
          >
            <span>•</span>
            <span class="font-mono text-gray-800 dark:text-gray-300">{{
              channelId
            }}</span>
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
      <client-only>
        <div
          class="hidden sm:flex items-center justify-end space-x-2 md:flex-1"
        >
          <LoginButton />
        </div>
      </client-only>
      <div class="flex items-center space-x-2">
        <CreateAnythingButton />
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
