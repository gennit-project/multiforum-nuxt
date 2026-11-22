<script lang="ts" setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Component,
} from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import CalendarIcon from '@/components/icons/CalendarIcon.vue';
import DiscussionIcon from '@/components/icons/DiscussionIcon.vue';
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import CogIcon from '@/components/icons/CogIcon.vue';
import InfoIcon from '@/components/icons/InfoIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import type { ChannelDetail as Channel } from '@/types/ChannelPresentation';
import {
  useModProfileName,
  useUsername,
  useIsAuthenticated,
} from '@/composables/useAuthState';
import { preloadRouteComponents, useRoute } from 'nuxt/app';
import { useDisplay } from '@/composables/useDisplay';
import { useQuery } from '@vue/apollo-composable';
import { GetServerConfigDocument as GET_SERVER_CONFIG } from '@/__generated__/operations';
import { config } from '@/config';
import { computeVisibleTabCount } from '@/utils/tabOverflow';
// Import Popper dynamically to avoid SSR issues with regeneratorRuntime
import { defineAsyncComponent } from 'vue';
const Popper = defineAsyncComponent(() => import('vue3-popper'));

const modProfileNameVar = useModProfileName();
const usernameVar = useUsername();
const isAuthenticatedVar = useIsAuthenticated();

type Tab = {
  name: string;
  routeSuffix: string;
  label: string;
  icon: Component;
  countProperty:
    | 'DiscussionChannelsConnection'
    | 'EventChannelsConnection'
    | 'IssuesConnection'
    | '__DOWNLOAD_COUNT__'
    | null;
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

// Auth state is seeded from the server session and is SSR-consistent, so no
// auth-hint cookie bridge or SSR/client special-casing is needed.
const shouldShowAuthTabs = computed(() => isAuthenticatedVar.value);

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

const { mdAndUp } = useDisplay();
const hasMounted = ref(false);
const preloadedTabRoutes = new Set<string>();

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
      countProperty: 'DiscussionChannelsConnection',
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
      countProperty: 'EventChannelsConnection',
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
    const adminList = (props.channel?.Admins || []).map(
      (user) => user.username || ''
    );
    const modList = (props.channel.Moderators ?? []).map(
      (modProfile) => modProfile.displayName
    );

    // Seeded from the server session, consistent on SSR and client.
    const currentUsername = loggedInUsername.value;
    const currentModName = modProfileNameVar.value;

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
        countProperty: 'IssuesConnection',
      });
    }
  }

  filteredResult.push({
    name: 'about',
    routeSuffix: 'about',
    label: 'About',
    icon: InfoIcon,
    countProperty: null,
  });

  return filteredResult;
});

const preloadMobileTabRoutes = () => {
  if (!hasMounted.value || mdAndUp.value) {
    return;
  }

  for (const tab of tabs.value) {
    const tabRoute = tabRoutes.value[tab.name];
    if (
      !tabRoute ||
      tabRoute === route.path ||
      preloadedTabRoutes.has(tabRoute)
    ) {
      continue;
    }

    preloadedTabRoutes.add(tabRoute);
    void preloadRouteComponents(tabRoute).catch(() => {
      preloadedTabRoutes.delete(tabRoute);
    });
  }
};

onMounted(() => {
  hasMounted.value = true;
  preloadMobileTabRoutes();
});

watch([mdAndUp, tabs, tabRoutes], preloadMobileTabRoutes);

const tabCount = (tab: Tab): number | null | undefined => {
  if (!tab.countProperty) {
    return null;
  }
  return tab.countProperty === '__DOWNLOAD_COUNT__'
    ? props.downloadCount
    : props.channel[tab.countProperty]?.aggregate?.count?.nodes;
};

// --- Overflow ("More") menu for the horizontal tab bar ---------------------
// Every tab is rendered first so its natural width can be measured and cached.
// Tabs that do not fit beside the "More" button move into its dropdown.
const TAB_GAP_PX = 8;
const navRef = ref<HTMLElement | null>(null);
const moreRef = ref<HTMLElement | null>(null);
const tabWidths = ref<number[] | null>(null);
const visibleCount = ref(Number.POSITIVE_INFINITY);
let resizeObserver: ResizeObserver | null = null;
let measureFrame = 0;

const visibleTabs = computed(() => tabs.value.slice(0, visibleCount.value));
const overflowTabs = computed(() => tabs.value.slice(visibleCount.value));
const isMoreActive = computed(() =>
  overflowTabs.value.some((tab) => isTabActive(tab))
);

const measureOverflow = () => {
  const nav = navRef.value;
  if (!nav) {
    return;
  }
  if (!tabWidths.value) {
    const items = nav.querySelectorAll<HTMLElement>('[data-tab-item]');
    if (items.length !== tabs.value.length) {
      return;
    }
    tabWidths.value = Array.from(
      items,
      (item) => item.offsetWidth + TAB_GAP_PX
    );
  }
  visibleCount.value = computeVisibleTabCount({
    tabWidths: tabWidths.value,
    moreWidth: (moreRef.value?.offsetWidth ?? 0) + TAB_GAP_PX,
    containerWidth: nav.clientWidth,
  });
};

// Widths are stale whenever the tab list or a badge value changes: render
// everything again, then re-measure.
const remeasureOverflow = () => {
  tabWidths.value = null;
  visibleCount.value = Number.POSITIVE_INFINITY;
  void nextTick(measureOverflow);
};

const overflowKey = computed(() =>
  tabs.value
    .map((tab) => `${tab.name}:${props.showCounts ? tabCount(tab) : ''}`)
    .join('|')
);

watch(overflowKey, remeasureOverflow);

watch(
  navRef,
  (nav) => {
    resizeObserver?.disconnect();
    if (nav && resizeObserver) {
      resizeObserver.observe(nav);
      remeasureOverflow();
    }
  },
  { flush: 'post' }
);

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') {
    return;
  }
  // Defer to the next frame: changing the visible tabs inside the observer
  // callback would otherwise trigger "ResizeObserver loop" errors.
  resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(measureFrame);
    measureFrame = requestAnimationFrame(measureOverflow);
  });
  if (navRef.value) {
    resizeObserver.observe(navRef.value);
    remeasureOverflow();
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(measureFrame);
  resizeObserver?.disconnect();
});
</script>

<template>
  <div>
    <ClientOnly>
      <!-- Vertical sidebar tabs (md and up) -->
      <nav
        v-if="mdAndUp && vertical"
        aria-label="Tabs"
        class="text-md flex flex-col"
      >
        <TabButton
          v-for="tab in tabs"
          :key="tab.name"
          :count="tabCount(tab) ?? 0"
          :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
          :is-active="isTabActive(tab)"
          :label="tab.label"
          :show-count="showCounts && !!tab.countProperty"
          :to="tabRoutes[tab.name] || ''"
          :vertical="vertical"
        >
          <component :is="tab.icon" :class="iconSize" />
        </TabButton>
      </nav>

      <!-- Horizontal tabs (md and up); tabs that do not fit go in "More" -->
      <nav
        v-else-if="mdAndUp"
        ref="navRef"
        aria-label="Tabs"
        class="flex w-full items-start space-x-2 overflow-hidden text-sm whitespace-nowrap"
        data-testid="channel-tabs-horizontal"
      >
        <TabButton
          v-for="tab in visibleTabs"
          :key="tab.name"
          class="shrink-0"
          data-tab-item
          :count="tabCount(tab) ?? 0"
          :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
          :is-active="isTabActive(tab)"
          :label="tab.label"
          :show-count="showCounts && !!tab.countProperty"
          :to="tabRoutes[tab.name] || ''"
          :vertical="vertical"
        >
          <component :is="tab.icon" :class="iconSize" />
        </TabButton>
        <div
          ref="moreRef"
          class="shrink-0"
          :class="overflowTabs.length ? '' : 'invisible absolute'"
          data-testid="channel-tabs-more-container"
        >
          <Popper placement="bottom-end">
            <template #default>
              <button
                type="button"
                class="group inline-flex items-center pt-2 text-xs font-medium"
                :class="
                  isMoreActive
                    ? 'border-brand-500 border-b-2 text-gray-900 dark:text-gray-100'
                    : 'border-b-2 border-transparent text-gray-500 dark:text-gray-400'
                "
                aria-haspopup="menu"
                data-testid="channel-tabs-more"
              >
                <span
                  class="flex h-6 items-center space-x-2 rounded-lg px-2 py-4 group-hover:bg-gray-100 sm:my-1 dark:group-hover:bg-gray-700"
                >
                  <span class="text-gray-700 dark:text-white">More</span>
                  <i
                    class="fa-solid fa-chevron-down h-3 w-3"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </template>

            <template #content="{ close }">
              <div
                class="mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-600"
              >
                <div class="py-1">
                  <nuxt-link
                    v-for="tab in overflowTabs"
                    :key="tab.name"
                    :to="tabRoutes[tab.name] || ''"
                    :data-testid="`more-dropdown-${tab.name}`"
                    :aria-current="isTabActive(tab) ? 'page' : undefined"
                    class="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="[
                      isTabActive(tab)
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                        : 'text-gray-700 dark:text-gray-200',
                    ]"
                    @click="close"
                  >
                    <div class="flex items-center space-x-2">
                      <component :is="tab.icon" class="h-5 w-5 shrink-0" />
                      <span>{{ tab.label }}</span>
                    </div>
                    <span
                      v-if="showCounts && tab.countProperty && tabCount(tab)"
                      class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                    >
                      {{ tabCount(tab) }}
                    </span>
                  </nuxt-link>
                </div>
              </div>
            </template>
          </Popper>
        </div>
      </nav>

      <!-- Mobile Dropdown (sm and down) -->
      <div
        v-else
        class="relative py-4"
        data-testid="mobile-channel-nav-container"
      >
        <Popper>
          <template #default>
            <button
              class="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
                      : channel[activeTab?.countProperty]?.aggregate?.count
                          ?.nodes)
                  "
                  class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                >
                  {{
                    activeTab?.countProperty === '__DOWNLOAD_COUNT__'
                      ? downloadCount
                      : channel[activeTab?.countProperty]?.aggregate?.count
                          ?.nodes
                  }}
                </span>
              </div>
              <i
                class="fa-solid fa-chevron-down ml-2 h-4 w-4"
                aria-hidden="true"
              />
            </button>
          </template>

          <template #content="{ close }">
            <div
              class="mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-gray-600"
            >
              <div class="py-1">
                <nuxt-link
                  v-for="tab in tabs"
                  :key="tab.name"
                  :to="tabRoutes[tab.name] || ''"
                  :data-testid="`mobile-dropdown-${tab.name}`"
                  :aria-current="isTabActive(tab) ? 'page' : undefined"
                  class="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  :class="[
                    isTabActive(tab)
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                      : 'text-gray-700 dark:text-gray-200',
                  ]"
                  @click="close"
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
                        : channel[tab.countProperty]?.aggregate?.count?.nodes)
                    "
                    class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                  >
                    {{
                      tab.countProperty === '__DOWNLOAD_COUNT__'
                        ? downloadCount
                        : channel[tab.countProperty]?.aggregate?.count?.nodes
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
                  ? channel[tab.countProperty]?.aggregate?.count?.nodes
                  : 0
            "
            :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
            :is-active="isTabActive(tab)"
            :label="tab.label"
            :show-count="showCounts && !!tab.countProperty"
            :to="tabRoutes[tab.name] || ''"
            :vertical="vertical"
          >
            <component :is="tab.icon" :class="iconSize" />
          </TabButton>
        </nav>
      </template>
    </ClientOnly>
  </div>
</template>
