<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import TabButton from "@/components/channel/TabButton.vue";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
import FlagIcon from "@/components/icons/FlagIcon.vue";
import CogIcon from "@/components/icons/CogIcon.vue";
import InfoIcon from "@/components/icons/InfoIcon.vue";
import type { Channel } from "@/__generated__/graphql";
import { modProfileNameVar, usernameVar } from "@/cache";

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
});

const route = useRoute();
const forumId = ref(route.params.forumId);

watch(
  () => route.params,
  (to) => {
    forumId.value = to.forumId;
  },
);

const loggedInUsername = computed(() => {
  return usernameVar.value || '';
});

const tabRoutes = computed(() => {
  const routes: TabRoutes = {
    discussions: `/forums/${forumId.value}/discussions`,
    events: `/forums/${forumId.value}/events`,
    about: `/forums/${forumId.value}/about`,
    settings: `/forums/${forumId.value}/edit`,
    moderation: `/forums/${forumId.value}/issues`,
  };
  return routes;
});

const iconSize = computed(() => (props.vertical ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0"));

const tabs = computed((): Tab[] => {
  const baseTabs: Tab[] = [
    {
      name: "discussions",
      routeSuffix: "discussions",
      label: "Discussions",
      icon: DiscussionIcon,
      countProperty: "DiscussionChannelsAggregate",
    },
    {
      name: "events",
      routeSuffix: "events",
      label: "Events",
      icon: CalendarIcon,
      countProperty: "EventChannelsAggregate",
    },
    {
      name: "about",
      routeSuffix: "about",
      label: "About",
      icon: InfoIcon,
      countProperty: null,
    },
  ];

  const adminList = props.channel.Admins.map((user) => user.username || "");
  const modList = props.channel.Moderators.map((modProfile) => modProfile.displayName);
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

  return baseTabs;
});
</script>

<template>
  <div>
    <nav
      :class="vertical ? 'text-md flex flex-col' : 'flex space-x-2 pt-1 text-sm'"
      aria-label="Tabs"
    >
      <TabButton
        v-for="tab in tabs"
        :key="tab.name"
        :to="tabRoutes[tab.name]"
        :label="tab.label"
        :is-active="$route.path.includes(tab.routeSuffix)"
        :vertical="vertical"
        :show-count="showCounts && !!tab.countProperty"
        :count="tab.countProperty ? channel[tab.countProperty]?.count : 0"
      >
        <component
          :is="tab.icon"
          :class="iconSize"
        />
      </TabButton>
    </nav>
  </div>
</template>
