<script lang="ts" setup>
  import { computed, ref, watch, type Component } from "vue";
  import TabButton from "@/components/channel/TabButton.vue";
  import CalendarIcon from "@/components/icons/CalendarIcon.vue";
  import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
  import DownloadIcon from "@/components/icons/DownloadIcon.vue";
  import FlagIcon from "@/components/icons/FlagIcon.vue";
  import CogIcon from "@/components/icons/CogIcon.vue";
  import InfoIcon from "@/components/icons/InfoIcon.vue";
  import BookIcon from "@/components/icons/BookIcon.vue";
  import type { Channel } from "@/__generated__/graphql";
  import { modProfileNameVar, usernameVar } from "@/cache";
  import { useRoute } from "nuxt/app";
  import { useDisplay } from "vuetify";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_SERVER_CONFIG } from "@/graphQLData/admin/queries";
  import { config } from "@/config";
  // Import Popper dynamically to avoid SSR issues with regeneratorRuntime
  import { defineAsyncComponent } from 'vue';
  const Popper = defineAsyncComponent(() => import("vue3-popper"));

  type Tab = {
    name: string;
    routeSuffix: string;
    label: string;
    icon: Component;
    countProperty: keyof Channel | null;
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
      fetchPolicy: "cache-first",
    }
  );

  const serverDownloadsEnabled = computed(() => {
    return Boolean(serverConfigResult.value?.serverConfigs?.[0]?.enableDownloads);
  });

  const serverEventsEnabled = computed(() => {
    return Boolean(serverConfigResult.value?.serverConfigs?.[0]?.enableEvents);
  });

  const loggedInUsername = computed(() => {
    return usernameVar.value || "";
  });

  // Since component is now wrapped in ClientOnly, we can directly access auth state

  const tabRoutes = computed(() => {
    const routes: TabRoutes = {
      discussions: `/forums/${forumId.value}/discussions`,
      downloads: `/forums/${forumId.value}/downloads`,
      events: `/forums/${forumId.value}/events`,
      about: `/forums/${forumId.value}/about`,
      settings: `/forums/${forumId.value}/edit`,
      moderation: `/forums/${forumId.value}/issues`,
      wiki: `/forums/${forumId.value}/wiki`,
    };
    return routes;
  });

  const iconSize = computed(() => (props.vertical ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0"));

  const { smAndDown, mdAndUp } = useDisplay();
  
  // Find the current active tab
  const activeTab = computed(() => {
    return tabs.value.find(tab => route.path.includes(tab.routeSuffix)) || tabs.value[0];
  });

  const tabs = computed((): Tab[] => {
    const baseTabs: Tab[] = [
      {
        name: "discussions",
        routeSuffix: "discussions",
        label: "Discussions",
        icon: DiscussionIcon,
        countProperty: "DiscussionChannelsAggregate",
      },
    ];

    // Only show downloads tab if both server and channel have downloads enabled
    if (serverDownloadsEnabled.value && props.channel?.downloadsEnabled === true) {
      baseTabs.push({
        name: "downloads",
        routeSuffix: "downloads",
        label: "Downloads",
        icon: DownloadIcon,
        countProperty: null,
      });
    }

    // Only show events tab if both server and channel have events enabled
    if (serverEventsEnabled.value && props.channel?.eventsEnabled === true) {
      baseTabs.push({
        name: "events",
        routeSuffix: "events",
        label: "Calendar",
        icon: CalendarIcon,
        countProperty: "EventChannelsAggregate",
      });
    }

    if (props.channel?.wikiEnabled) {
      baseTabs.push({
        name: "wiki",
        routeSuffix: "wiki",
        label: "Wiki",
        icon: BookIcon,
        countProperty: null,
      });
    }

    // Now we can safely access auth state since component is client-only
    const adminList = props.channel.Admins.map((user) => user.username || "");
    const modList = (props.channel.Moderators ?? []).map((modProfile) => modProfile.displayName);
    const isAdmin = adminList.includes(loggedInUsername.value);
    const isMod = modList.includes(modProfileNameVar.value);

    if (isAdmin) {
      baseTabs.push({
        name: "settings",
        routeSuffix: "edit",
        label: "Settings",
        icon: CogIcon,
        countProperty: null,
      });
    }

    if (isAdmin || isMod) {
      baseTabs.push({
        name: "moderation",
        routeSuffix: "issues",
        label: "Issues",
        icon: FlagIcon,
        countProperty: "IssuesAggregate",
      });
    }
    
    if (smAndDown.value) {
      baseTabs.push({
        name: "about",
        routeSuffix: "about",
        label: "About",
        icon: InfoIcon,
        countProperty: null,
      });
    }

    return baseTabs;
  });
</script>

<template>
  <div>
    <!-- Desktop/Tablet Tabs (md and up) -->
    <nav
      v-if="mdAndUp"
      aria-label="Tabs"
      :class="vertical ? 'text-md flex flex-col' : 'space-x-2 overflow-x-auto text-sm'"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :count="tab.countProperty ? channel[tab.countProperty]?.count : 0"
        :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
        :is-active="route.path.includes(tab.routeSuffix)"
        :label="tab.label"
        :show-count="showCounts && !!tab.countProperty"
        :to="tabRoutes[tab.name]"
        :vertical="vertical"
      >
        <component
          :is="tab.icon"
          :class="iconSize"
        />
      </TabButton>
    </nav>

    <!-- Mobile Dropdown (sm and down) -->
    <div v-else class="relative">
      <ClientOnly>
        <Popper>
          <template #default>
            <button
              class="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              data-testid="mobile-channel-nav-dropdown"
            >
              <div class="flex items-center space-x-2">
                <component
                  :is="activeTab.icon"
                  class="h-5 w-5 shrink-0"
                />
                <span>{{ activeTab.label }}</span>
                <span
                  v-if="showCounts && activeTab.countProperty && channel[activeTab.countProperty]?.count"
                  class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                >
                  {{ channel[activeTab.countProperty]?.count }}
                </span>
              </div>
              <i class="fa-solid fa-chevron-down h-4 w-4 ml-2"/>
            </button>
          </template>

          <template #content>
          <div class="mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-600">
            <div class="py-1">
              <nuxt-link
                v-for="tab in tabs"
                :key="tab.name"
                :to="tabRoutes[tab.name]"
                :data-testid="`mobile-dropdown-${tab.name}`"
                class="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="[
                  route.path.includes(tab.routeSuffix)
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300'
                    : 'text-gray-700 dark:text-gray-200'
                ]"
              >
                <div class="flex items-center space-x-2">
                  <component
                    :is="tab.icon"
                    class="h-5 w-5 shrink-0"
                  />
                  <span>{{ tab.label }}</span>
                </div>
                <span
                  v-if="showCounts && tab.countProperty && channel[tab.countProperty]?.count"
                  class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
                >
                  {{ channel[tab.countProperty]?.count }}
                </span>
              </nuxt-link>
            </div>
          </div>
        </template>
      </Popper>
      <template #fallback>
        <!-- Fallback content for SSR - show a simple button that doesn't work but looks right -->
        <button
          class="flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          data-testid="mobile-channel-nav-dropdown"
        >
          <div class="flex items-center space-x-2">
            <component
              :is="activeTab.icon"
              class="h-5 w-5 shrink-0"
            />
            <span>{{ activeTab.label }}</span>
            <span
              v-if="showCounts && activeTab.countProperty && channel[activeTab.countProperty]?.count"
              class="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-600 dark:text-white"
            >
              {{ channel[activeTab.countProperty]?.count }}
            </span>
          </div>
          <i class="fa-solid fa-chevron-down h-4 w-4 ml-2"/>
        </button>
      </template>
      </ClientOnly>
    </div>
  </div>
</template>