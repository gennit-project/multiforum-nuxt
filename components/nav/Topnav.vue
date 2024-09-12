<script setup lang="ts">
import { computed, ref } from "vue";
import HamburgerMenuButton from "@/components/nav/MenuButton.vue";
import UserProfileDropdownMenu from "@/components/nav/UserProfileDropdownMenu.vue";
import ThemeSwitcher from "@/components/nav/ThemeSwitcher.vue";
import { useAuth0 } from '@/hooks/useAuth0';
import { useQuery } from "@vue/apollo-composable";
import {
  GET_LOCAL_USERNAME,
  GET_LOCAL_MOD_PROFILE_NAME,
} from "@/graphQLData/user/queries";
import CreateAnythingButton from "@/components/nav/CreateAnythingButton.vue";
import ArrowUpBoldBox from "vue-material-design-icons/ArrowUpBoldBox.vue";
import { useRoute } from "vue-router";

defineEmits(["toggleDropdown"]);

const { isAuthenticated, login } = useAuth0();

const route = useRoute();

const { result } = useQuery(GET_LOCAL_USERNAME);
const username = computed(() => result.value?.username || "");

const channelId = computed(() => (typeof route.params.forumId === "string" ? route.params.forumId : ""));

const { result: modNameResult } = useQuery(GET_LOCAL_MOD_PROFILE_NAME);
const modName = computed(() => modNameResult.value?.modProfileName || "");

// Component state
const sideNavIsOpen = ref(false);

// Computed properties
const shouldShowChannelId = computed(() => channelId.value);
const shouldShowRouteInfo = computed(() => route.name === "MapView" || route.name === "SearchChannels");
const routeInfoLabel = computed(() => {
  if (route.name === "MapView") return "events map";
  if (route.name === "SearchChannels") return "Forums";
  return "";
});

// Methods
function getLabel() {
  if (route.name === "SitewideSearchDiscussionPreview") return "• discussions";
  if (route.name === "SearchEventsList") return "• online events";
  if (route.name === "MapEventPreview") return "• in-person events";
}
</script>

<template>
  <div class="z-10 w-full bg-gray-100 border-b dark:bg-black dark:border-b-gray-600">
    <div class="flex items-center justify-between px-2 py-2 lg:px-4 lg:py-1">
      <div class="flex items-center">
        <HamburgerMenuButton
          v-if="!sideNavIsOpen"
          data-testid="menu-button"
          class="cursor-pointer fixed-menu-button"
          @click="$emit('toggleDropdown')"
        />
        <div class="flex items-center space-x-1 ml-12 text-sm text-gray-500 dark:text-white">
          <NuxtLink to="/" class="flex gap-2 items-center">
            <ArrowUpBoldBox :size="38" class="text-black dark:text-blue-500" />
            <span class="font-bold text-black dark:text-white">Topical</span>
            <span class="text-blue-500 text-xs py-0.5 px-1 border rounded-md border-blue-500 dark:text-blue-500">ALPHA</span>
          </NuxtLink>
          <div v-if="shouldShowChannelId" class="hidden sm:flex items-center gap-1">
            <span>•</span>
            <span class="font-mono text-gray-800 dark:text-gray-300">{{ channelId }}</span>
          </div>
          <div v-else-if="shouldShowRouteInfo" class="hidden sm:flex items-center gap-1">
            <span>•</span>
            {{ routeInfoLabel }}
          </div>
          <div v-else class="hidden sm:flex items-center gap-1">
            {{ getLabel() }}
          </div>
        </div>
      </div>
      <div class="hidden sm:flex items-center justify-end space-x-2 md:flex-1">
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
        <CreateAnythingButton />
        <ThemeSwitcher />
        <div v-if="isAuthenticated && username" class="hidden lg:block">
          <div class="flex items-center">
            <div class="relative flex-shrink-0">
              <UserProfileDropdownMenu :username="username" :mod-name="modName" />
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
