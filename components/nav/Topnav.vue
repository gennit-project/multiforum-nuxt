<script setup lang="ts">
import { computed, ref } from "vue";
import HamburgerMenuButton from "@/components/nav/MenuButton.vue";
import UserProfileDropdownMenu from "@/components/nav/UserProfileDropdownMenu.vue";
import ThemeSwitcher from "@/components/nav/ThemeSwitcher.vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { useQuery } from "@vue/apollo-composable";
import {
  GET_LOCAL_USERNAME,
  GET_LOCAL_MOD_PROFILE_NAME,
} from "@/graphQLData/user/queries";
import CreateAnythingButton from "@/components/nav/CreateAnythingButton.vue";
import ArrowUpBoldBox from "vue-material-design-icons/ArrowUpBoldBox.vue";
import { useDisplay } from "vuetify";
import { useRoute } from "vue-router";

// Authentication
const { isAuthenticated, loginWithPopup, loginWithRedirect } = useAuth0();

// Route handling
const route = useRoute();

// Display utilities
const { smAndDown } = useDisplay();

// Queries
const { result } = useQuery(GET_LOCAL_USERNAME);
const username = computed(() => {
  let username = result.value?.username;
  if (username) {
    return username;
  }
  return "";
});

const channelId = computed(() => {
  if (typeof route.params.channelId !== "string") {
    return "";
  }
  return route.params.channelId;
});

const { result: modNameResult } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);
const modName = computed(() => {
  let modName = modNameResult.value?.modProfileName;
  if (modName) {
    return modName;
  }
  return "";
});

// Component state
const sideNavIsOpen = ref(false);

// Computed properties
const shouldShowChannelId = computed(() => channelId.value);
const shouldShowRouteInfo = computed(() => {
  return (
    route.name === "MapView" || route.name === "SearchChannels"
  );
});
const routeInfoLabel = computed(() => {
  if (route.name === "MapView") {
    return "events map";
  } else if (route.name === "SearchChannels") {
    return "Forums";
  }
  return "";
});

// Methods
function getLabel() {
  if (route.name === "SitewideSearchDiscussionPreview") {
    return "• discussions";
  }
  if (route.name === "SearchEventsList") {
    return "• online events";
  }
  if (route.name === "MapEventPreview") {
    return "• in-person events";
  }
}

</script>

<template>
  <div class="z-10 w-full bg-gray-100 border-b dark:bg-black dark:border-b-gray-600">
    <div
      :class="[smAndDown ? 'px-2 py-2' : 'px-4 py-1']"
      class="flex items-center justify-between"
    >
      <div class="flex items-center lg:px-0">
        <HamburgerMenuButton
          v-if="!sideNavIsOpen"
          data-testid="menu-button"
          class="cursor-pointer fixed-menu-button"
          @click="$emit('toggleDropdown')"
        />
        <div
          class="flex items-center space-x-1 ml-12 text-sm text-gray-500 dark:text-white"
        >
          <NuxtLink
            to="/"
            class="flex gap-2 items-center"
          >
            <ArrowUpBoldBox
              :size="38"
              class="text-black dark:text-blue-500"
            />
            <span class="font-bold text-black dark:text-white">Topical</span>
            <span class="text-blue-500 text-xs py-0.5 px-1 border rounded-md border-blue-500 dark:text-blue-500">ALPHA</span>
          </NuxtLink>
          <div
            v-if="shouldShowChannelId && !smAndDown"
            class="flex items-center gap-1"
          >
            <span>•</span>
            <span class="font-mono text-gray-800 dark:text-gray-300">{{
              channelId
            }}</span>
          </div>
          <div
            v-else-if="shouldShowRouteInfo && !smAndDown"
            class="flex items-center gap-1"
          >
            <span>•</span>
            {{ routeInfoLabel }}
          </div>
          <div
            v-else-if="!smAndDown"
            class="flex items-center gap-1"
          >
            {{ getLabel() }}
          </div>
        </div>
      </div>
      <div
        v-if="!smAndDown"
        class="flex items-center justify-end space-x-2 md:flex md:flex-1"
      >
        <button
          v-if="!isAuthenticated"
          data-testid="login-button"
          class="font-medium mr-2 inline-flex items-center rounded-full px-3 py-1 text-xs text-gray-400 hover:dark:text-white hover:text-black"
          @click="login"
        >
          Log In
        </button>
      </div>
      <div class="flex items-center space-x-2">
        <!-- <SearchButton /> -->
        <CreateAnythingButton />
        <ThemeSwitcher />
        <div
          v-if="isAuthenticated && username"
          class="hidden lg:ml-4 lg:block"
        >
          <div class="flex items-center">
            <!-- <NotificationButton/> -->
            <div class="relative flex-shrink-0">
              <UserProfileDropdownMenu
                :username="username"
                :mod-name="modName"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fixed-menu-button {
  position: fixed;  /* Makes the button stay in the same place on the screen */
  top: 6px;       /* Distance from the top of the viewport */
  left: 10px;      /* Distance from the left of the viewport */
  z-index: 19;    /* Ensures the button is above other content */
}
</style>
