<script lang="ts" setup>
import { computed, ref, watch, type Component } from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import CogIcon from '@/components/icons/CogIcon.vue';
import InfoIcon from '@/components/icons/InfoIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import type { Channel } from '@/__generated__/graphql';
import { modProfileNameVar, usernameVar, isLoadingAuthVar } from '@/cache';
import { useRoute } from 'nuxt/app';
import { useDisplay } from 'vuetify';
import { useQuery } from '@vue/apollo-composable';
import { GET_SERVER_CONFIG } from '@/graphQLData/admin/queries';
import { config } from '@/config';
import { useSSRAuth } from '@/composables/useSSRAuth';
// Import Popper dynamically to avoid SSR issues with regeneratorRuntime
import { defineAsyncComponent } from 'vue';
const Popper = defineAsyncComponent(() => import('vue3-popper'));

type Tab = {
  name: string;
  routeSuffix: string;
  label: string;
  icon: Component;
  countProperty: keyof Channel | '__DOWNLOAD_COUNT__' | null;
};

type TabRoutes = {
  [key: string]: string;
};

const props = defineProps({
  adminList: {
    type: Array,
    default: () => [],
  },
  channel: {
    type: Object as () => Channel,
    required: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  showCounts: {
    type: Boolean,
    default: false,
  },
  desktop: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const forumId = ref(route.params.forumId);

watch(
  () => route.params,
  (to) => {
    forumId.value = to.forumId;
  }
);

// Get server config to check if downloads are enabled server-wide
const { result: serverConfigResult } = useQuery(
  GET_SERVER_CONFIG,
  {
    serverName: config.serverName,
  },
  {
    fetchPolicy: 'cache-first',
  }
);

const serverDownloadsEnabled = computed(() => {
  return Boolean(serverConfigResult.value?.serverConfigs?.[0]?.enableDownloads);
});

const serverEventsEnabled = computed(() => {
  return Boolean(serverConfigResult.value?.serverConfigs?.[0]?.enableEvents);
});

const loggedInUsername = computed(() => {
  return usernameVar.value || '';
});

const { hasAuthHint, usernameHint } = useSSRAuth();

// Check if auth is still loading or if we should show auth-dependent tabs
const shouldShowAuthTabs = computed(() => {
  // In SSR, we can use auth hints to show tabs if user was previously logged in
  if (!import.meta.client) {
    return hasAuthHint.value;
  }

  // On client-side, show auth tabs if not loading and user is authenticated
  return !isLoadingAuthVar.value && (usernameVar.value || hasAuthHint.value);
});

const tabRoutes = computed(() => {
  const routes: TabRoutes = {
    discussions: `/forums/${forumId.value}/discussions`,
    downloads: `/forums/${forumId.value}/downloads`,
    events: `/forums/${forumId.value}/events`,
    about: `/forums/${forumId.value}/about`,
    settings: `/forums/${forumId.value}/edit`,
    moderation: `/forums/${forumId.value}/issues`,
    wiki: `/forums/${forumId.value}/wiki`,
    contributors: `/forums/${forumId.value}/contributors`,
  };
  return routes;
});

const iconSize = computed(() =>
  props.vertical ? 'h-6 w-6 shrink-0' : 'h-5 w-5 shrink-0'
);

const { smAndDown, mdAndUp } = useDisplay();

// Check if a tab should be active based on route
const isTabActive = (tab: Tab) => {
  const path = route.path;
  // Special case: wiki tab should not be active on wiki-settings page
  if (tab.routeSuffix === 'wiki' && path.includes('/edit/wiki-settings')) {
    return false;
  }
  return path.includes(tab.routeSuffix);
};

// Find the current active tab
const activeTab = computed(() => {
  return tabs.value.find((tab) => isTabActive(tab)) || tabs.value[0];
});

// Base tabs that are always shown (SSR-safe, no client-specific conditions)
const baseTabs = computed((): Tab[] => {
  const result: Tab[] = [
    {
      name: 'discussions',
      routeSuffix: 'discussions',
      label: 'Discussions',
      icon: DiscussionIcon,
      countProperty: 'DiscussionChannelsAggregate',
    },
  ];

  // Channel-level flags are safe to use (they come from props/server data)
  if (props.channel?.downloadsEnabled === true) {
    result.push({
      name: 'downloads',
      routeSuffix: 'downloads',
      label: 'Downloads',
      icon: DownloadIcon,
      countProperty: '__DOWNLOAD_COUNT__',
    });
  }

  if (props.channel?.eventsEnabled === true) {
    result.push({
      name: 'events',
      routeSuffix: 'events',
      label: 'Calendar',
      icon: CalendarIcon,
      countProperty: 'EventChannelsAggregate',
    });
  }

  if (props.channel?.wikiEnabled) {
    result.push({
      name: 'wiki',
      routeSuffix: 'wiki',
      label: 'Wiki',
      icon: BookIcon,
      countProperty: null,
    });
  }

  // Add contributors tab (visible to everyone)
  result.push({
    name: 'contributors',
    routeSuffix: 'contributors',
    label: 'Contributors',
    icon: UserIcon,
    countProperty: null,
  });

  return result;
});

// Full tabs including client-specific conditions (used only on client)
const tabs = computed((): Tab[] => {
  const result = [...baseTabs.value];

  // Filter based on server config (only available after query resolves on client)
  const filteredResult = result.filter((tab) => {
    if (tab.name === 'downloads' && !serverDownloadsEnabled.value) {
      return false;
    }
    if (tab.name === 'events' && !serverEventsEnabled.value) {
      return false;
    }
    return true;
  });

  // Add auth-dependent tabs only if we should show them
  if (shouldShowAuthTabs.value) {
    const adminList = props.channel.Admins.map((user) => user.username || '');
    const modList = (props.channel.Moderators ?? []).map(
      (modProfile) => modProfile.displayName
    );

    // For SSR, use auth hints; for client, use current auth state
    const currentUsername = !import.meta.client
      ? usernameHint.value
      : loggedInUsername.value;
    const currentModName = !import.meta.client ? '' : modProfileNameVar.value; // Mod name not stored in hints for security

    const isAdmin = adminList.includes(currentUsername);
    const isMod = currentModName ? modList.includes(currentModName) : false;

    if (isAdmin) {
      filteredResult.push({
        name: 'settings',
        routeSuffix: 'edit',
        label: 'Settings',
        icon: CogIcon,
        countProperty: null,
      });
    }

    if (isAdmin || isMod) {
      filteredResult.push({
        name: 'moderation',
        routeSuffix: 'issues',
        label: 'Issues',
        icon: FlagIcon,
        countProperty: 'IssuesAggregate',
      });
    }
  }

  if (smAndDown.value) {
    filteredResult.push({
      name: 'about',
      routeSuffix: 'about',
      label: 'About',
      icon: InfoIcon,
      countProperty: null,
    });
  }

  return filteredResult;
});
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Desktop/Tablet Tabs (md and up) -->
      <nav
        v-if="mdAndUp"
        aria-label="Tabs"
        :class="
          vertical
            ? 'text-md flex flex-col'
            : 'space-x-2 overflow-x-auto text-sm'
        "
      >
        <TabButton
          v-for="tab in tabs"
          :key="tab.name"
          :count="
            tab.countProperty === '__DOWNLOAD_COUNT__'
              ? downloadCount
              : tab.countProperty
                ? channel[tab.countProperty]?.count
                : 0
          "
          :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
          :is-active="isTabActive(tab)"
          :label="tab.label"
          :show-count="showCounts && !!tab.countProperty"
          :to="tabRoutes[tab.name]"
          :vertical="vertical"
        >
          <component :is="tab.icon" :class="iconSize" />
        </TabButton>
      </nav>

      <!-- Mobile Dropdown (sm and down) -->
      <div v-else class="relative">
        <Popper>
          <template #default>
            <button
              class="hover:bg-gray-50 flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              data-testid="mobile-channel-nav-dropdown"
            >
              <div class="flex items-center space-x-2">
                <component :is="activeTab?.icon" class="h-5 w-5 shrink-0" />
                <span>{{ activeTab?.label }}</span>
                <span
                  v-if="
                    showCounts &&
                    activeTab?.countProperty &&
                    (activeTab?.countProperty === '__DOWNLOAD_COUNT__'
                      ? downloadCount
                      : channel[activeTab?.countProperty]?.count)
                  "
                  class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                >
                  {{
                    activeTab?.countProperty === '__DOWNLOAD_COUNT__'
                      ? downloadCount
                      : channel[activeTab?.countProperty]?.count
                  }}
                </span>
              </div>
              <i class="fa-solid fa-chevron-down ml-2 h-4 w-4" />
            </button>
          </template>

          <template #content>
            <div
              class="mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-600"
            >
              <div class="py-1">
                <nuxt-link
                  v-for="tab in tabs"
                  :key="tab.name"
                  :to="tabRoutes[tab.name]"
                  :data-testid="`mobile-dropdown-${tab.name}`"
                  class="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  :class="[
                    isTabActive(tab)
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                      : 'text-gray-700 dark:text-gray-200',
                  ]"
                >
                  <div class="flex items-center space-x-2">
                    <component :is="tab.icon" class="h-5 w-5 shrink-0" />
                    <span>{{ tab.label }}</span>
                  </div>
                  <span
                    v-if="
                      showCounts &&
                      tab.countProperty &&
                      (tab.countProperty === '__DOWNLOAD_COUNT__'
                        ? downloadCount
                        : channel[tab.countProperty]?.count)
                    "
                    class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                  >
                    {{
                      tab.countProperty === '__DOWNLOAD_COUNT__'
                        ? downloadCount
                        : channel[tab.countProperty]?.count
                    }}
                  </span>
                </nuxt-link>
              </div>
            </div>
          </template>
        </Popper>
      </div>

      <!-- SSR Fallback: Show desktop-style tabs using SSR-stable baseTabs -->
      <template #fallback>
        <nav
          aria-label="Tabs"
          :class="
            vertical
              ? 'text-md flex flex-col'
              : 'space-x-2 overflow-x-auto text-sm'
          "
        >
          <TabButton
            v-for="tab in baseTabs"
            :key="tab.name"
            :count="
              tab.countProperty === '__DOWNLOAD_COUNT__'
                ? downloadCount
                : tab.countProperty
                  ? channel[tab.countProperty]?.count
                  : 0
            "
            :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
            :is-active="isTabActive(tab)"
            :label="tab.label"
            :show-count="showCounts && !!tab.countProperty"
            :to="tabRoutes[tab.name]"
            :vertical="vertical"
          >
            <component :is="tab.icon" :class="iconSize" />
          </TabButton>
        </nav>
      </template>
    </ClientOnly>
  </div>
</template>
