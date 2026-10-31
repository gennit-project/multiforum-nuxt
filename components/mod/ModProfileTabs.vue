<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import TabButton from '@/components/channel/TabButton.vue';
import type { GetModQuery } from '@/__generated__/operations';

import { useRoute } from 'nuxt/app';
type ModerationProfile = GetModQuery['moderationProfiles'][number];

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
  return typeof route.params.modId === 'string' ? route.params.modId : '';
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
      name: 'Comments',
      href: `/mod/${modNameInParams.value}/comments`,
      current: true,
      count: props.mod?.AuthoredCommentsConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Mod Actions',
      href: `/mod/${modNameInParams.value}/actions`,
      current: false,
      count: props.mod?.ActivityFeedConnection?.aggregate?.count?.nodes,
    },
    {
      name: 'Issues',
      href: `/mod/${modNameInParams.value}/issues`,
      current: false,
      count: props.mod?.AuthoredIssuesConnection?.aggregate?.count?.nodes,
    },
  ];
  return tabList;
});
</script>

<template>
  <nav
    class="max-w-[theme(screens.2xl)] space-x-2 pt-1 text-sm"
    aria-label="Tabs"
  >
    <TabButton
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.href"
      :label="tab.name"
      :count="tab.count || undefined"
      :show-count="showCounts && !!tab.count"
    />
  </nav>
</template>
