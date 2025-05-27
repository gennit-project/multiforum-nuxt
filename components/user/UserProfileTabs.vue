<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import TabButton from "@/components/channel/TabButton.vue";
import type { User } from "@/__generated__/graphql";
import { usernameVar, isAuthenticatedVar } from "@/cache";
import { useRoute } from "nuxt/app";

const route = useRoute();

type TabData = {
  name: string;
  href: string;
  current: boolean;
  count?: number | null;
};

const props = defineProps({
  vertical: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object as () => User,
    required: true,
  },
  showCounts: {
    type: Boolean,
    default: false,
  },
});

const channelId = ref(route.params.forumId);
const usernameInParams = computed(() => {
  return typeof route.params.username === "string" ? route.params.username : "";
});

watch(
  () => route,
  (to) => {
    channelId.value = to.params.channelId;
  }
);

// Define the tabs based on the user data and authentication status
const tabs = computed(() => {
  const tabList: TabData[] = [
    {
      name: "Comments",
      href: `/u/${usernameInParams.value}/comments`,
      current: true,
      count: props.user?.CommentsAggregate?.count,
    },
    {
      name: "Discussions",
      href: `/u/${usernameInParams.value}/discussions`,
      current: false,
      count: props.user?.DiscussionsAggregate?.count,
    },
    {
      name: "Events",
      href: `/u/${usernameInParams.value}/events`,
      current: false,
      count: props.user?.EventsAggregate?.count,
    },
    {
      name: "Owned Forums",
      href: `/u/${usernameInParams.value}/ownedForums`,
      current: false,
      count: props.user?.AdminOfChannelsAggregate?.count,
    },
    {
      name: "Modded Forums",
      href: `/u/${usernameInParams.value}/moddedForums`,
      current: false,
      count: props.user?.ModOfChannelsAggregate?.count,
    },
  ];

  if (
    isAuthenticatedVar.value &&
    usernameVar.value === usernameInParams.value
  ) {
    tabList.push({
      name: "Settings",
      href: `/u/${usernameInParams.value}/settings`,
      current: false,
      count: null,
    });
  }
  return tabList;
});
</script>

<template>
  <nav class="max-w-screen-2xl space-x-2 pt-1 text-sm" aria-label="Tabs">
    <TabButton
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.href"
      :label="tab.name"
      :is-active="
        route && typeof route.name === 'string' && route.name.includes(tab.name)
      "
      :count="tab.count || undefined"
      :show-count="showCounts && !!tab.count"
    />
  </nav>
</template>
