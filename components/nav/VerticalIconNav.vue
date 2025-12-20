<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { useDisplay } from 'vuetify';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue';
import CreateAnythingButton from '@/components/nav/CreateAnythingButton.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import SettingsIcon from '@/components/icons/SettingsIcon.vue';
import AdminIcon from '@/components/icons/AdminIcon.vue';
import LoginIcon from '@/components/icons/LoginIcon.vue';
import MoreIcon from '@/components/icons/MoreIcon.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import IconTooltip from '@/components/common/IconTooltip.vue';
import RecentForumsDrawer from './RecentForumsDrawer.vue';
import { GET_USER } from '@/graphQLData/user/queries';
import { usernameVar, isAuthenticatedVar } from '@/cache';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';
import SiteSidenavLogout from './SiteSidenavLogout.vue';
import type { ForumItem } from '@/types/forum';

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
    name: 'Discuss',
    href: '/discussions',
    icon: DiscussionIcon,
    routerName: 'discussions',
  },
  {
    name: 'Downloads',
    href: '/downloads',
    icon: DownloadIcon,
    routerName: 'downloads',
  },
  {
    name: 'Calendars',
    href: '/events/list/search',
    icon: CalendarIcon,
    routerName: 'events-list-search',
  },
  {
    name: 'Forums',
    href: '/forums',
    icon: ChannelIcon,
    routerName: 'forums',
  },
  {
    name: 'Library',
    href: '/library',
    icon: BookmarkIcon,
    routerName: 'library',
  },
];

const recentForums = ref<ForumItem[]>([]);

const loadRecentForums = () => {
  if (!import.meta.client) {
    recentForums.value = [];
    return;
  }
  const forums = getLocalStorageItem<ForumItem[]>('recentForums', []);
  recentForums.value = forums
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, DEFAULT_LIMIT);
};

// Load initial forums only on client
if (import.meta.client) {
  loadRecentForums();
}

const { result: getUserResult } = useQuery(
  GET_USER,
  {
    username: usernameVar.value,
  },
  {
    enabled: !!usernameVar.value,
  }
);

const user = computed(() => getUserResult.value?.users[0] || null);
const profilePicURL = computed(() => user.value?.profilePicURL || '');

const route = useRoute();
const { height } = useDisplay();

// Check if screen is vertically short (less than 700px)
// Use client-side only to avoid hydration mismatches
const isVerticallyShort = computed(() => {
  if (!import.meta.client) return false; // Default to false on server
  return height.value < 700;
});

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
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
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

  const existingForums = getLocalStorageItem<ForumItem[]>('recentForums', []);

  // Check if the current forum is already in the visible portion (top VERTICAL_NAV_LIMIT)
  const visibleForums = existingForums.slice(0, VERTICAL_NAV_LIMIT);
  const isAlreadyVisible = visibleForums.some(
    (forum) => forum.uniqueName === currentForumId.value
  );

  // If it's already visible, just update the timestamp without changing order
  if (isAlreadyVisible) {
    const updatedForums = existingForums.map((forum) =>
      forum.uniqueName === currentForumId.value
        ? { ...forum, timestamp: Date.now() }
        : forum
    );
    setLocalStorageItem('recentForums', updatedForums);
    loadRecentForums();
    return;
  }

  // If not visible, move to top (existing behavior)
  const currentForum = {
    uniqueName: currentForumId.value,
    channelIconURL: null, // Will be updated when we have the icon
    timestamp: Date.now(),
  };

  // Remove existing entry if it exists
  const filteredForums = existingForums.filter(
    (forum) => forum.uniqueName !== currentForumId.value
  );

  // Add current forum to the top
  const updatedForums = [currentForum, ...filteredForums];

  setLocalStorageItem('recentForums', updatedForums);

  // Reload the recent forums to update the UI
  loadRecentForums();
};

// Watch for route changes and add current forum to recent list
watch(
  currentForumId,
  (newForumId, oldForumId) => {
    if (newForumId && newForumId !== oldForumId) {
      addCurrentForumToRecent();
    }
  },
  { immediate: true }
);

const getIconCircleClasses = (isActive: boolean) => {
  const baseClasses =
    'w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer';
  return isActive
    ? `${baseClasses} ring-1 ring-orange-500 ring-offset-1 ring-offset-gray-900`
    : baseClasses;
};

const getForumIconClasses = (isActive: boolean) => {
  const baseClasses =
    'w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer overflow-hidden';
  return isActive
    ? `${baseClasses} ring-2 ring-orange-500 ring-offset-0`
    : baseClasses;
};

const getUserActionClasses = (isActive: boolean) => {
  const baseClasses =
    'rounded-full my-2 bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-200 cursor-pointer';
  return isActive
    ? `${baseClasses} ring-1 ring-orange-500 ring-offset-1 ring-offset-gray-900`
    : baseClasses;
};
</script>

<template>
  <ClientOnly>
    <div
      class="fixed left-0 top-0 z-[18] hidden h-full w-20 flex-col items-center border-r border-gray-600 bg-gray-900 lg:flex"
      :class="{ 'py-2': isVerticallyShort, 'py-4': !isVerticallyShort }"
    >
      <!-- Create Button -->
      <IconTooltip
        text="Create new"
        :class="{ 'mb-2': isVerticallyShort, 'mb-4': !isVerticallyShort }"
      >
        <div class="flex flex-col items-center">
          <CreateAnythingButton icon-only />
          <span
            class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
          >
            Create
          </span>
        </div>
      </IconTooltip>

      <!-- Main Navigation Icons -->
      <div
        class="flex flex-col"
        :class="{
          'space-y-1': isVerticallyShort,
          'space-y-2': !isVerticallyShort,
        }"
      >
        <IconTooltip
          v-for="item in navigation"
          :key="item.name"
          :text="item.name"
        >
          <div class="flex flex-col items-center">
            <NuxtLink
              :to="
                item.routerName === 'library'
                  ? item.href
                  : { name: item.routerName }
              "
              :class="getIconCircleClasses(isActiveNavItem(item.routerName))"
            >
              <component
                :is="item.icon"
                class="h-6 w-6 text-gray-300"
                aria-hidden="true"
              />
            </NuxtLink>
            <span
              class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
            >
              {{ item.name }}
            </span>
          </div>
        </IconTooltip>
      </div>

      <!-- Divider -->
      <div
        v-if="!isVerticallyShort"
        class="h-px w-8 bg-gray-600"
        :class="{ 'my-2': isVerticallyShort, 'my-4': !isVerticallyShort }"
      />

      <!-- Recent Forums (hidden when vertically short) -->
      <ClientOnly>
        <div
          v-if="recentForums.length > 0 && !isVerticallyShort"
          class="flex flex-col space-y-1"
        >
          <!-- Limited Recent Forums -->
          <IconTooltip
            v-for="forum in limitedRecentForums"
            :key="forum.uniqueName"
            :text="forum.uniqueName"
          >
            <div class="flex flex-col items-center">
              <NuxtLink
                :to="{
                  name: 'forums-forumId-discussions',
                  params: { forumId: forum.uniqueName },
                }"
                :class="
                  getForumIconClasses(currentForumId === forum.uniqueName)
                "
              >
                <AvatarComponent
                  class="h-8 w-8"
                  :text="forum.uniqueName || ''"
                  :src="forum?.channelIconURL ?? ''"
                  :is-small="true"
                  :is-square="false"
                />
              </NuxtLink>
              <span
                class="mt-0.5 w-12 truncate text-center text-[9px] leading-[10px] text-gray-400"
              >
                {{ forum.uniqueName }}
              </span>
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
            <span class="mt-0.5 text-[9px] leading-[10px] text-gray-400"
              >More</span
            >
          </div>
        </div>
      </ClientOnly>

      <!-- Divider -->
      <div
        class="h-px w-8 bg-gray-600"
        :class="{ 'my-2': isVerticallyShort, 'my-4': !isVerticallyShort }"
      />

      <!-- User Actions -->
      <div
        class="mt-auto flex flex-col"
        :class="{
          'space-y-1': isVerticallyShort,
          'space-y-2': !isVerticallyShort,
        }"
      >
        <!-- Admin Dashboard (always shown) -->
        <IconTooltip text="Admin Dashboard">
          <div class="flex flex-col items-center">
            <NuxtLink
              to="/admin/issues"
              :class="getUserActionClasses(isActiveUserAction('admin-issues'))"
            >
              <AdminIcon />
            </NuxtLink>
            <span
              class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
            >
              Admin
            </span>
          </div>
        </IconTooltip>

        <!-- Authentication-dependent actions -->
        <ClientOnly>
          <!-- Profile -->

          <!-- Settings -->
          <IconTooltip
            v-if="isAuthenticatedVar && usernameVar"
            text="Account Settings"
          >
            <div class="flex flex-col items-center">
              <NuxtLink
                to="/account_settings"
                :class="
                  getUserActionClasses(isActiveUserAction('account_settings'))
                "
              >
                <SettingsIcon />
              </NuxtLink>
              <span
                class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
              >
                Settings
              </span>
            </div>
          </IconTooltip>

          <template #fallback>
            <!-- Fallback: Show login icon as default -->
            <IconTooltip text="Log In">
              <div class="flex flex-col items-center">
                <div :class="getUserActionClasses(false)">
                  <LoginIcon />
                </div>
                <span
                  class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
                >
                  Log in
                </span>
              </div>
            </IconTooltip>
          </template>
        </ClientOnly>
      </div>

      <!-- Recent Forums Drawer -->
      <RecentForumsDrawer
        :forums="recentForums"
        :is-open="isDrawerOpen"
        @close="isDrawerOpen = false"
      />
    </div>
    <template #fallback>
      <!-- Server-side fallback with default classes (no responsive behavior) -->
      <div
        class="fixed left-0 top-0 z-[18] hidden h-full w-16 flex-col items-center border-r border-gray-600 bg-gray-900 py-4 lg:flex"
      >
        <!-- Logo -->
        <IconTooltip text="Topical - Home" class="mb-4">
          <div class="flex flex-col items-center">
            <NuxtLink
              to="/"
              class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-orange-500 transition-colors duration-200 hover:bg-orange-600"
            >
              <span class="text-2xl">🐝</span>
            </NuxtLink>
            <span
              class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
            >
              Home
            </span>
          </div>
        </IconTooltip>

        <!-- Main Navigation Icons -->
        <div class="flex flex-col space-y-2">
          <IconTooltip
            v-for="item in navigation"
            :key="item.name"
            :text="item.name"
          >
            <div class="flex flex-col items-center">
              <NuxtLink
                :to="
                  item.routerName === 'library'
                    ? item.href
                    : { name: item.routerName }
                "
                :class="getIconCircleClasses(isActiveNavItem(item.routerName))"
              >
                <component
                  :is="item.icon"
                  class="h-6 w-6 text-gray-300"
                  aria-hidden="true"
                />
              </NuxtLink>
              <span
                class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
              >
                {{ item.name }}
              </span>
            </div>
          </IconTooltip>
        </div>

        <!-- Divider -->
        <div class="my-4 h-px w-8 bg-gray-600" />

        <!-- Divider -->
        <div class="my-4 h-px w-8 bg-gray-600" />

        <!-- User Actions -->
        <div class="mt-auto flex flex-col space-y-2">
          <!-- Admin Dashboard -->
          <IconTooltip text="Admin Dashboard">
            <div class="flex flex-col items-center">
              <NuxtLink
                to="/admin/issues"
                :class="
                  getUserActionClasses(isActiveUserAction('admin-issues'))
                "
              >
                <AdminIcon />
              </NuxtLink>
              <span
                class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
              >
                Admin
              </span>
            </div>
          </IconTooltip>

          <!-- Login fallback -->
          <IconTooltip text="Log In">
            <div class="flex flex-col items-center">
              <div :class="getUserActionClasses(false)">
                <LoginIcon />
              </div>
              <span
                class="mt-0.5 w-12 text-center text-[9px] leading-[10px] text-gray-400"
              >
                Log in
              </span>
            </div>
          </IconTooltip>
        </div>

        <!-- Recent Forums Drawer -->
        <RecentForumsDrawer :forums="[]" :is-open="false" @close="() => {}" />
      </div>
    </template>
  </ClientOnly>
</template>
