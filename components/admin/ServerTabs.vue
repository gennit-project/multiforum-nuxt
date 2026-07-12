<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import type { Component } from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import LockClosedIcon from '@/components/icons/LockClosedIcon.vue';
import CogIcon from '@/components/icons/CogIcon.vue';
import PlugIcon from '@/components/icons/PlugIcon.vue';
import InfoIcon from '@/components/icons/InfoIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import type { Channel } from '@/__generated__/graphql';
import { useRoute } from 'nuxt/app';
import { LayoutDashboard } from 'lucide-vue-next';
import { useDisplay } from '@/composables/useDisplay';

const Popper = defineAsyncComponent(() => import('vue3-popper'));

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
  serverConfig: {
    type: Object as () => Channel,
    required: true,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  desktop: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const { mdAndUp } = useDisplay();

const tabRoutes = computed(() => {
  const routes: TabRoutes = {
    dashboard: `/admin/dashboard`,
    issues: `/admin/issues`,
    channelReports: `/admin/channel-reports`,
    settings: `/admin/settings`,
    suspensions: `/admin/suspensions/server-membership`,
    plugins: `/admin/plugins`,
    about: `/admin/about`,
  };
  return routes;
});

const iconSize = computed(() =>
  props.vertical ? 'h-6 w-6 shrink-0' : 'h-5 w-5 shrink-0'
);

const isTabActive = (tab: Tab) => route.path.includes(tab.routeSuffix);

const tabs = computed((): Tab[] => {
  const baseTabs: Tab[] = [
    {
      name: 'dashboard',
      routeSuffix: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      countProperty: null,
    },
    {
      name: 'issues',
      routeSuffix: 'issues',
      label: 'Issues',
      icon: FlagIcon,
      countProperty: 'IssuesAggregate',
    },
    {
      name: 'channelReports',
      routeSuffix: 'channel-reports',
      label: 'Channel Reports',
      icon: LockClosedIcon,
      countProperty: null,
    },
    {
      name: 'settings',
      routeSuffix: 'settings',
      label: 'Settings',
      icon: CogIcon,
      countProperty: null,
    },
    {
      name: 'suspensions',
      routeSuffix: 'suspensions',
      label: 'Suspensions',
      icon: UserIcon,
      countProperty: null,
    },
    {
      name: 'plugins',
      routeSuffix: 'plugins',
      label: 'Plugins',
      icon: PlugIcon,
      countProperty: null,
    },
    {
      name: 'about',
      routeSuffix: 'about',
      label: 'About',
      icon: InfoIcon,
      countProperty: null,
    },
  ];

  return baseTabs;
});

const activeTab = computed(() => {
  return tabs.value.find((tab) => isTabActive(tab)) || tabs.value[0];
});
</script>

<template>
  <div>
    <ClientOnly>
      <nav
        v-if="mdAndUp"
        :class="
          vertical
            ? 'text-md flex flex-col'
            : 'flex flex-wrap gap-x-2 gap-y-1 pt-1 text-sm'
        "
        aria-label="Tabs"
      >
        <TabButton
          v-for="tab in tabs"
          :key="tab.name"
          :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
          :to="tabRoutes[tab.name] || ''"
          :label="tab.label"
          :is-active="isTabActive(tab)"
          :compact="true"
          :vertical="vertical"
          :show-count="false"
        >
          <component :is="tab.icon" :class="iconSize" />
        </TabButton>
      </nav>

      <div v-else class="relative">
        <Popper>
          <template #default>
            <button
              class="hover:bg-gray-50 flex w-full items-center justify-between rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              data-testid="mobile-admin-nav-dropdown"
            >
              <div class="flex items-center space-x-2">
                <component :is="activeTab?.icon" class="h-5 w-5 shrink-0" />
                <span>{{ activeTab?.label }}</span>
              </div>
              <i class="fa-solid fa-chevron-down ml-2 h-4 w-4" aria-hidden="true" />
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
                  :to="tabRoutes[tab.name] || ''"
                  :data-testid="`mobile-dropdown-${tab.name}`"
                  class="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
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
                </nuxt-link>
              </div>
            </div>
          </template>
        </Popper>
      </div>

      <template #fallback>
        <nav
          :class="
            vertical
              ? 'text-md flex flex-col'
              : 'flex flex-wrap gap-x-2 gap-y-1 pt-1 text-sm'
          "
          aria-label="Tabs"
        >
          <TabButton
            v-for="tab in tabs"
            :key="tab.name"
            :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
            :to="tabRoutes[tab.name] || ''"
            :label="tab.label"
            :is-active="isTabActive(tab)"
            :compact="true"
            :vertical="vertical"
            :show-count="false"
          >
            <component :is="tab.icon" :class="iconSize" />
          </TabButton>
        </nav>
      </template>
    </ClientOnly>
  </div>
</template>
