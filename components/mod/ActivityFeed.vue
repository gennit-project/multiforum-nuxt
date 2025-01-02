<script lang="ts" setup>
import { computed } from "vue";
import type { ModerationAction } from "@/__generated__/graphql";
import ActivityFeedListItem from "./ActivityFeedListItem.vue";

const props = defineProps<{
  feedItems: ModerationAction[];
  label: string;
}>();

const reversedFeedItems = computed(() => {
  return props.feedItems.slice().reverse();
});
</script>

<template>
  <div class="flow-root">
    <NuxtPage />
    <ul role="list" class="-mb-8">
      <ActivityFeedListItem
        v-for="activityItem in reversedFeedItems"
        :key="activityItem.id"
        :activity-item="activityItem"
      />
    </ul>
  </div>
</template>
