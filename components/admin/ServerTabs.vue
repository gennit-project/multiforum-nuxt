<script lang="ts" setup>
  import { computed } from "vue";
  import TabButton from "@/components/channel/TabButton.vue";
  import FlagIcon from "@/components/icons/FlagIcon.vue";
  import CogIcon from "@/components/icons/CogIcon.vue";
  import IdentificationIcon from "../icons/IdentificationIcon.vue";
  import type { Channel } from "@/__generated__/graphql";
  import { useRoute } from "nuxt/app";

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
    };
    return routes;
  });

  const iconSize = computed(() => (props.vertical ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0"));

  const tabs = computed((): Tab[] => {
    const baseTabs: Tab[] = [
      {
        name: "issues",
        routeSuffix: "issues",
        label: "Issues",
        icon: FlagIcon,
        countProperty: "IssuesAggregate",
      },
      {
        name: "settings",
        routeSuffix: "edit",
        label: "Settings",
        icon: CogIcon,
        countProperty: null,
      },
      {
        name: "roles",
        routeSuffix: "roles",
        label: "Roles",
        icon: IdentificationIcon,
        countProperty: null,
      },
    ];

    return baseTabs;
  });
</script>

<template>
  <div>
    <nav
      aria-label="Tabs"
      :class="vertical ? 'text-md flex flex-col' : 'flex space-x-2 pt-1 text-sm'"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :data-testid="`forum-tab-${desktop ? 'desktop' : 'mobile'}-${tab.name}`"
        :is-active="route.path.includes(tab.routeSuffix)"
        :label="tab.label"
        :show-count="false"
        :to="tabRoutes[tab.name]"
        :vertical="vertical"
      >
        <component
          :is="tab.icon"
          :class="iconSize"
        />
      </TabButton>
    </nav>
  </div>
</template>
