<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import TabButton from "@/components/channel/TabButton.vue";
import type { ModerationProfile } from "@/__generated__/graphql";
import { useRoute } from "nuxt/app";

const route = useRoute();

type TabData = {
  name: string;
  href: string;
  current: boolean;
  count?: number | null;
};

const props = defineProps({
  mod: {
    type: Object as () => ModerationProfile,
    required: true,
  },
  showCounts: {
    type: Boolean,
    default: false,
  },
});

const channelId = ref(route.params.forumId);
const modNameInParams = computed(() => {
  return typeof route.params.modId === "string" ? route.params.modId : "";
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
      href: `/mod/${modNameInParams.value}/comments`,
      current: true,
      count: props.mod?.AuthoredCommentsAggregate?.count,
    },
    {
      name: "Mod Actions",
      href: `/mod/${modNameInParams.value}/actions`,
      current: false,
      count: props.mod?.ActivityFeedAggregate?.count,
    },
    {
      name: "Issues",
      href: `/mod/${modNameInParams.value}/issues`,
      current: false,
      count: props.mod?.AuthoredIssuesAggregate?.count,
    },
  ];
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
