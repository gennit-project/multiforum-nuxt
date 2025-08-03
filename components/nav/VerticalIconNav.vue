<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { useDisplay } from "vuetify";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import LocationIcon from "@/components/icons/LocationIcon.vue";
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
import ChannelIcon from "@/components/icons/ChannelIcon.vue";
import UserIcon from "@/components/icons/UserIcon.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";
import AdminIcon from "@/components/icons/AdminIcon.vue";
import LoginIcon from "@/components/icons/LoginIcon.vue";
import MoreIcon from "@/components/icons/MoreIcon.vue";
import AvatarComponent from "@/components/AvatarComponent.vue";
import IconTooltip from "@/components/common/IconTooltip.vue";
import RecentForumsDrawer from "./RecentForumsDrawer.vue";
import { GET_USER } from "@/graphQLData/user/queries";
import { usernameVar, isAuthenticatedVar } from "@/cache";
import SiteSidenavLogout from "./SiteSidenavLogout.vue";

const DEFAULT_LIMIT = 5;
const VERTICAL_NAV_LIMIT = 3;

type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  routerName: string;
};

const navigation: NavigationItem[] = [
  { 
    name: "Search Forum Calendars", 
    href: "/events/list/search", 
    icon: CalendarIcon,
    routerName: "events-list-search"
  },
  { 
    name: "Search In-person Events", 
    href: "/map/search", 
    icon: LocationIcon,
    routerName: "map-search"
  },
  { 
    name: "Discussions", 
    href: "/discussions", 
    icon: DiscussionIcon,
    routerName: "discussions"
  },
  { 
    name: "All Forums", 
    href: "/forums", 
    icon: ChannelIcon,
    routerName: "forums"
  },
];

type ForumItem = {
  uniqueName: string;
  channelIconURL?: string | null;
  timestamp: number;
};

const recentForums = ref<ForumItem[]>([]);

const loadRecentForums = () => {
  if (!import.meta.client) {
    recentForums.value = [];
    return;
  }
  const forums = JSON.parse(localStorage.getItem("recentForums") || "[]") || [];
  recentForums.value = forums.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, DEFAULT_LIMIT);
};

// Load initial forums
loadRecentForums();

const { result: getUserResult } = useQuery(GET_USER, {
  username: usernameVar.value,
},{
  enabled: !!usernameVar.value,
});

const user = computed(() => getUserResult.value?.users[0] || null);
const profilePicURL = computed(() => user.value?.profilePicURL || "");

const router = useRouter();
const route = useRoute();
const { height } = useDisplay();

// Check if screen is vertically short (less than 700px)
const isVerticallyShort = computed(() => height.value < 700);

// Drawer state
const isDrawerOpen = ref(false);

// Limited forums for vertical nav
const limitedRecentForums = computed(() => {
  return recentForums.value.slice(0, VERTICAL_NAV_LIMIT);
});

const hasMoreForums = computed(() => {
  return recentForums.value.length > VERTICAL_NAV_LIMIT;
});

// Active state detection
const currentForumId = computed(() => 
  typeof route.params.forumId === "string" ? route.params.forumId : ""
);

const isActiveNavItem = (routeName: string) => {
  return route.name === routeName;
};

const isActiveUserAction = (routeName: string) => {
  return route.name === routeName;
};

// Auto-add current forum to recent forums
const addCurrentForumToRecent = () => {
  if (!import.meta.client || !currentForumId.value) return;
  
  const existingForums = JSON.parse(localStorage.getItem("recentForums") || "[]");
  const currentForum = {
    uniqueName: currentForumId.value,
    channelIconURL: null, // Will be updated when we have the icon
    timestamp: Date.now()
  };
  
  // Remove existing entry if it exists
  const filteredForums = existingForums.filter((forum: any) => forum.uniqueName !== currentForumId.value);
  
  // Add current forum to the top
  const updatedForums = [currentForum, ...filteredForums];
  
  localStorage.setItem("recentForums", JSON.stringify(updatedForums));
  
  // Reload the recent forums to update the UI
  loadRecentForums();
};

// Watch for route changes and add current forum to recent list
watch(currentForumId, (newForumId, oldForumId) => {
  if (newForumId && newForumId !== oldForumId) {
    addCurrentForumToRecent();
  }
}, { immediate: true });

const navigateTo = async (route: RouteLocationAsRelativeGeneric) => {
  try {
    await router.push(route);
  } catch (error) {
    console.error("Navigation error:", error);
  }
};

const getIconCircleClasses = (isActive: boolean) => {
  const baseClasses = "w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer";
  return isActive ? `${baseClasses} ring-1 ring-orange-500 ring-offset-1 ring-offset-gray-900` : baseClasses;
};

const getForumIconClasses = (isActive: boolean) => {
  const baseClasses = "w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer overflow-hidden";
  return isActive ? `${baseClasses} ring-2 ring-orange-500 ring-offset-0` : baseClasses;
};

const getUserActionClasses = (isActive: boolean) => {
  const baseClasses = "w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer";
  return isActive ? `${baseClasses} ring-1 ring-orange-500 ring-offset-1 ring-offset-gray-900` : baseClasses;
};
</script>

<template>
  <div class="fixed left-0 top-0 h-full w-16 bg-gray-900 border-r border-gray-600 hidden lg:flex flex-col items-center z-40" :class="{ 'py-2': isVerticallyShort, 'py-4': !isVerticallyShort }">
    <!-- Logo -->
    <IconTooltip text="Topical - Home" :class="{ 'mb-2': isVerticallyShort, 'mb-4': !isVerticallyShort }">
      <div 
        class="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors duration-200 cursor-pointer"
        @click="() => navigateTo({ name: 'index' })"
      >
        <span class="text-2xl">🐝</span>
      </div>
    </IconTooltip>

    <!-- Main Navigation Icons -->
    <div class="flex flex-col" :class="{ 'space-y-1': isVerticallyShort, 'space-y-2': !isVerticallyShort }">
      <IconTooltip
        v-for="item in navigation"
        :key="item.name"
        :text="item.name"
      >
        <div
          :class="getIconCircleClasses(isActiveNavItem(item.routerName))"
          @click="() => navigateTo({ name: item.routerName })"
        >
          <component
            :is="item.icon"
            class="h-6 w-6 text-gray-300"
            aria-hidden="true"
          />
        </div>
      </IconTooltip>
    </div>

    <!-- Divider -->
    <div v-if="!isVerticallyShort" class="w-8 h-px bg-gray-600" :class="{ 'my-2': isVerticallyShort, 'my-4': !isVerticallyShort }"></div>

    <!-- Recent Forums (hidden when vertically short) -->
    <div v-if="recentForums.length > 0 && !isVerticallyShort" class="flex flex-col space-y-1">
      <!-- Limited Recent Forums -->
      <IconTooltip
        v-for="forum in limitedRecentForums"
        :key="forum.uniqueName"
        :text="forum.uniqueName"
      >
        <div
          :class="getForumIconClasses(currentForumId === forum.uniqueName)"
          @click="() => navigateTo({
            name: 'forums-forumId-discussions',
            params: { forumId: forum.uniqueName },
          })"
        >
          <AvatarComponent
            class="h-8 w-8"
            :text="forum.uniqueName || ''"
            :src="forum?.channelIconURL ?? ''"
            :is-small="true"
            :is-square="false"
          />
        </div>
      </IconTooltip>

      <!-- More Button -->
      <div v-if="hasMoreForums" class="flex flex-col items-center">
        <IconTooltip text="More Forums">
          <div
            :class="getUserActionClasses(false)"
            @click="isDrawerOpen = true"
          >
            <MoreIcon />
          </div>
        </IconTooltip>
        <span class="text-xs text-gray-400 mt-1">More</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="w-8 h-px bg-gray-600" :class="{ 'my-2': isVerticallyShort, 'my-4': !isVerticallyShort }"></div>

    <!-- User Actions -->
    <div class="flex flex-col mt-auto" :class="{ 'space-y-1': isVerticallyShort, 'space-y-2': !isVerticallyShort }">
      <!-- Profile -->
      <IconTooltip
        v-if="isAuthenticatedVar && usernameVar"
        text="My Profile"
      >
        <div
          :class="getUserActionClasses(isActiveUserAction('u-username'))"
          @click="() => navigateTo({
            name: 'u-username',
            params: { username: usernameVar },
          })"
        >
          <AvatarComponent
            v-if="profilePicURL"
            :text="usernameVar"
            :src="profilePicURL"
            :is-small="true"
            class="h-8 w-8"
          />
          <UserIcon v-else />
        </div>
      </IconTooltip>

      <!-- Settings -->
      <IconTooltip
        v-if="isAuthenticatedVar && usernameVar"
        text="Account Settings"
      >
        <div
          :class="getUserActionClasses(isActiveUserAction('account_settings'))"
          @click="() => navigateTo({ name: 'account_settings' })"
        >
          <SettingsIcon />
        </div>
      </IconTooltip>

      <!-- Admin Dashboard -->
      <IconTooltip text="Admin Dashboard">
        <div
          :class="getUserActionClasses(isActiveUserAction('admin-issues'))"
          @click="() => navigateTo({ name: 'admin-issues' })"
        >
          <AdminIcon />
        </div>
      </IconTooltip>

      <!-- Sign Out -->
      <IconTooltip
        v-if="isAuthenticatedVar"
        text="Sign Out"
      >
        <SiteSidenavLogout 
          :nav-link-classes="getUserActionClasses(false)"
          :show-icon-only="true"
        />
      </IconTooltip>

      <!-- Sign In -->
      <IconTooltip
        v-if="!isAuthenticatedVar"
        text="Log In"
      >
        <div
          :class="getUserActionClasses(false)"
        >
          <LoginIcon />
        </div>
      </IconTooltip>
    </div>

    <!-- Recent Forums Drawer -->
    <RecentForumsDrawer
      :forums="recentForums"
      :is-open="isDrawerOpen"
      @close="isDrawerOpen = false"
    />
  </div>
</template>