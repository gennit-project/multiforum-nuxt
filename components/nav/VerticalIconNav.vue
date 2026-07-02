<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { Component } from 'vue';
import { useRoute } from 'nuxt/app';
import { useDisplay } from 'vuetify';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import BookmarkIcon from '@/components/icons/BookmarkIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import CreateAnythingButton from '@/components/nav/CreateAnythingButton.vue';
import AdminIcon from '@/components/icons/AdminIcon.vue';
import LoginIcon from '@/components/icons/LoginIcon.vue';
import MoreIcon from '@/components/icons/MoreIcon.vue';
import AvatarComponent from '@/components/AvatarComponent.vue';
import IconTooltip from '@/components/common/IconTooltip.vue';
import RecentForumsDrawer from './RecentForumsDrawer.vue';
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from '@/utils/localStorageUtils';
import type { ForumItem } from '@/types/forum';

const DEFAULT_LIMIT = 5;
const VERTICAL_NAV_LIMIT = 3;

type NavigationItem = {
  name: string;
  href: string;
  icon: Component;
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
    name: 'Wikis',
    href: '/wiki/search',
    icon: BookIcon,
    routerName: 'wiki-search',
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

const route = useRoute();
const { height } = useDisplay();
const hasMounted = ref(false);

// Keep SSR and client hydration aligned, then apply viewport-height layout after mount.
onMounted(() => {
  hasMounted.value = true;
});
const isVerticallyShort = computed(() => {
  if (!hasMounted.value) return false;
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

const ACTIVE_NAV_ITEM =
  'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-300 dark:bg-orange-950/70 dark:text-orange-200 dark:ring-orange-700/70';

const getNavItemClasses = (isActive: boolean) => {
  const baseClasses =
    'flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-gray-600 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100';
  return isActive ? `${baseClasses} ${ACTIVE_NAV_ITEM}` : baseClasses;
};

const getNavIconClasses = (isActive: boolean) =>
  isActive
    ? 'h-6 w-6 text-orange-700 dark:text-orange-200'
    : 'h-6 w-6 text-gray-500 dark:text-gray-300';

const getNavLabelClasses = (isActive: boolean) =>
  isActive
    ? 'w-full text-center text-[10px] leading-[10px] font-medium text-orange-700 dark:text-orange-200'
    : 'w-full text-center text-[10px] leading-[10px] text-gray-600 dark:text-gray-300';
</script>

<template>
  <div
    class="fixed left-0 top-0 z-[18] hidden h-full w-20 flex-col items-center border-r border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 lg:flex"
    :class="{ 'py-2': isVerticallyShort, 'py-4': !isVerticallyShort }"
  >
      <!-- Create Button -->
      <IconTooltip
        text="Create new"
        :class="{ 'mb-2': isVerticallyShort, 'mb-4': !isVerticallyShort }"
      >
        <CreateAnythingButton icon-only />
      </IconTooltip>

      <!-- Main Navigation Icons -->
      <div
        class="flex w-full flex-col px-2"
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
          <div class="w-full">
            <NuxtLink
              :to="
                item.routerName === 'library'
                  ? item.href
                  : { name: item.routerName }
              "
              :aria-label="item.name"
              :title="item.name"
              :class="getNavItemClasses(isActiveNavItem(item.routerName))"
            >
              <component
                :is="item.icon"
                :class="getNavIconClasses(isActiveNavItem(item.routerName))"
                aria-hidden="true"
              />
              <span :class="getNavLabelClasses(isActiveNavItem(item.routerName))">
                {{ item.name }}
              </span>
            </NuxtLink>
          </div>
        </IconTooltip>
      </div>

      <!-- Divider -->
      <div
        v-if="!isVerticallyShort"
        class="h-px w-8 bg-gray-200 dark:bg-gray-600"
        :class="{ 'my-2': isVerticallyShort, 'my-4': !isVerticallyShort }"
      />

      <!-- Recent Forums (hidden when vertically short) -->
      <ClientOnly>
        <div
          v-if="recentForums.length > 0 && !isVerticallyShort"
          class="recent-forums-rail flex w-full flex-col items-center space-y-1"
        >
          <!-- Limited Recent Forums -->
          <IconTooltip
            v-for="forum in limitedRecentForums"
            :key="forum.uniqueName"
            :text="forum.uniqueName"
          >
            <div class="w-full px-2">
              <NuxtLink
                :to="{
                  name: 'forums-forumId-discussions',
                  params: { forumId: forum.uniqueName },
                }"
                :aria-label="forum.uniqueName"
                :title="forum.uniqueName"
                :class="getNavItemClasses(currentForumId === forum.uniqueName)"
              >
                <AvatarComponent
                  class="h-8 w-8"
                  :text="forum.uniqueName || ''"
                  :src="forum?.channelIconURL ?? ''"
                  :is-small="true"
                  :is-square="false"
                />
                <span
                  :class="[
                    getNavLabelClasses(currentForumId === forum.uniqueName),
                    'truncate',
                  ]"
                >
                  {{ forum.uniqueName }}
                </span>
              </NuxtLink>
            </div>
          </IconTooltip>

          <!-- More Button -->
          <div v-if="hasMoreForums" class="w-full px-2">
            <IconTooltip text="More Forums" class="!block w-full">
              <button
                type="button"
                :class="getNavItemClasses(false)"
                aria-label="More forums"
                title="More forums"
                @click="isDrawerOpen = true"
              >
                <MoreIcon :class="getNavIconClasses(false)" />
                <span
                  class="w-full text-center text-[10px] leading-[10px] text-gray-600 dark:text-gray-300"
                  >More</span
                >
              </button>
            </IconTooltip>
          </div>
        </div>
      </ClientOnly>

      <!-- Divider -->
      <div
        class="h-px w-8 bg-gray-200 dark:bg-gray-600"
        :class="{ 'my-2': isVerticallyShort, 'my-4': !isVerticallyShort }"
      />

      <!-- User Actions -->
      <div
        class="mt-auto flex w-full flex-col px-2"
        :class="{
          'space-y-1': isVerticallyShort,
          'space-y-2': !isVerticallyShort,
        }"
      >
        <!-- Admin Dashboard (always shown) -->
        <IconTooltip text="Admin Dashboard">
          <div class="w-full">
            <NuxtLink
              to="/admin/issues"
              aria-label="Admin dashboard"
              title="Admin dashboard"
              :class="getNavItemClasses(isActiveUserAction('admin-issues'))"
            >
              <AdminIcon />
              <span :class="getNavLabelClasses(isActiveUserAction('admin-issues'))">
                Admin
              </span>
            </NuxtLink>
          </div>
        </IconTooltip>

        <!-- Authentication-dependent actions -->
        <ClientOnly>
          <template #fallback>
            <!-- Fallback: Show login icon as default -->
            <IconTooltip text="Log In">
              <div class="w-full">
                <div :class="getNavItemClasses(false)">
                  <LoginIcon />
                  <span :class="getNavLabelClasses(false)">
                    Log in
                  </span>
                </div>
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
</template>
