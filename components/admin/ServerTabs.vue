<script lang="ts" setup>
import { computed } from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import FlagIcon from '@/components/icons/FlagIcon.vue';
import CogIcon from '@/components/icons/CogIcon.vue';
import IdentificationIcon from '../icons/IdentificationIcon.vue';
import PlugIcon from '@/components/icons/PlugIcon.vue';
import InfoIcon from '@/components/icons/InfoIcon.vue';
import type { Channel } from '@/__generated__/graphql';
import { useRoute } from 'nuxt/app';

type Tab = {
  name: string;
  routeSuffix: string;
  label: string;
  icon: any;
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

const tabRoutes = computed(() => {
  const routes: TabRoutes = {
    issues: `/admin/issues`,
    settings: `/admin/settings`,
    roles: `/admin/roles`,
    plugins: `/admin/plugins`,
    about: `/admin/about`,
  };
  return routes;
});

const iconSize = computed(() =>
  props.vertical ? 'h-6 w-6 shrink-0' : 'h-5 w-5 shrink-0'
);

const tabs = computed((): Tab[] => {
  const baseTabs: Tab[] = [
    {
      name: 'issues',
      routeSuffix: 'issues',
      label: 'Issues',
      icon: FlagIcon,
      countProperty: 'IssuesAggregate',
    },
    {
      name: 'settings',
      routeSuffix: 'settings',
      label: 'Settings',
      icon: CogIcon,
      countProperty: null,
    },
    {
      name: 'roles',
      routeSuffix: 'roles',
      label: 'Roles',
      icon: IdentificationIcon,
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
</script>

<template>
  <div>
    <nav
      :class="
        vertical ? 'text-md flex flex-col' : 'flex space-x-2 pt-1 text-sm'
      "
      aria-label="Tabs"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
        :to="tabRoutes[tab.name]"
        :label="tab.label"
        :is-active="route.path.includes(tab.routeSuffix)"
        :vertical="vertical"
        :show-count="false"
      >
        <component :is="tab.icon" :class="iconSize" />
      </TabButton>
    </nav>
  </div>
</template>
