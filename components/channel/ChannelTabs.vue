<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useQuery } from "@vue/apollo-composable";
import TabButton from "@/components/channel/TabButton.vue";
import CalendarIcon from "@/components/icons/CalendarIcon.vue";
import DiscussionIcon from "@/components/icons/DiscussionIcon.vue";
import FlagIcon from "@/components/icons/FlagIcon.vue";
import CogIcon from "@/components/icons/CogIcon.vue";
import InfoIcon from "@/components/icons/InfoIcon.vue";
import { useDisplay } from "vuetify";
import { GET_LOCAL_MOD_PROFILE_NAME, GET_LOCAL_USERNAME } from "@/graphQLData/user/queries";
import type { Channel } from "@/__generated__/graphql";

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
const channelId = ref(route.params.forumId);
const { mdAndDown } = useDisplay();

watch(
  () => route.params,
  (to) => {
    channelId.value = to.channelId;
  },
);

const { result: localUsernameResult } = useQuery(GET_LOCAL_USERNAME);
const username = computed(() => {
  return localUsernameResult.value?.username || "";
});

const loggedInUsername = computed(() => {
  return localUsernameResult.value?.username || "";
});

const tabRoutes = computed(() => {
  const routes: TabRoutes = {
    discussions: `/forums/${channelId.value}/discussions`,
    events: `/forums/${channelId.value}/events/search`,
    about: `/forums/${channelId.value}/about`,
    settings: `/forums/${channelId.value}/edit`,
    moderation: `/forums/${channelId.value}/issues`,
  };

  return routes;
});

const iconSize = computed(() => {
  return props.vertical ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0";
});

const tabs: Tab[] = [
  {
    name: "discussions",
    routeSuffix: "discussions",
    label: "Discussions",
    icon: DiscussionIcon,
    countProperty: "DiscussionChannelsAggregate",
  },
  {
    name: "events",
    routeSuffix: "events/search",
    label: "Events",
    icon: CalendarIcon,
    countProperty: "EventChannelsAggregate",
  },
];
const adminList = props.channel.Admins.map((user) => {
  return user.username || "";
});

const modList = props.channel.Moderators.map((modProfile) => {
  return modProfile.displayName;
});

const {
  result: localModProfileNameResult,
  loading: localModProfileNameLoading,
  error: localModProfileNameError,
} = useQuery(GET_LOCAL_MOD_PROFILE_NAME);

const loggedInUserModName = computed(() => {
  if (localModProfileNameLoading.value || localModProfileNameError.value) {
    return "";
  }
  return localModProfileNameResult.value?.modProfileName || "";
});

if (username.value && adminList.includes(username.value)) {
  tabs.push({
    name: "settings",
    routeSuffix: "edit",
    label: "Settings",
    icon: CogIcon,
    countProperty: null,
  });
}

const isAdmin = adminList.includes(loggedInUsername.value);
const isMod = modList.includes(loggedInUserModName.value);

if (isAdmin || isMod) {
  tabs.push({
    name: "moderation",
    routeSuffix: "issues",
    label: "Issues",
    icon: FlagIcon,
    countProperty: "IssuesAggregate",
  });
}

if (mdAndDown) {
  tabs.push({
    name: "about",
    routeSuffix: "about",
    label: "About",
    icon: InfoIcon,
    countProperty: null,
  });
}
</script>

<template>
  <div>
    <nav
      :class="{
        'text-md flex max-w-7xl flex-col': vertical,
        'max-w-7xl space-x-2 pt-1 text-sm': !vertical,
      }"
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
