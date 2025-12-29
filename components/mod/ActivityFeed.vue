<script lang="ts" setup>
import { computed } from 'vue';
import type { Discussion, ModerationAction } from '@/__generated__/graphql';
import ActivityFeedListItem from './ActivityFeedListItem.vue';

const props = defineProps<{
  feedItems: ModerationAction[];
  originalUserAuthorUsername: string;
  originalModAuthorName: string;
  relatedDiscussion?: Discussion | null;
}>();

const reversedFeedItems = computed(() => {
  return props.feedItems.slice().reverse();
});

// For each revision activity item, find what the content was changed TO
// by looking at the next revision's "old" body (which is this revision's "new" body)
const getNextRevisionBody = (currentIndex: number): string | null => {
  const items = reversedFeedItems.value;
  // Look for the next item (later in time) that has a Revision
  for (let i = currentIndex + 1; i < items.length; i++) {
    const item = items[i] as ModerationAction & { Revision?: { body?: string } };
    if (item.Revision?.body) {
      return item.Revision.body;
    }
  }
  // No next revision found - this is the most recent edit, use current discussion body
  return null;
};
</script>

<template>
  <div class="flow-root">
    <NuxtPage />
    <ul role="list">
      <ActivityFeedListItem
        v-for="(activityItem, index) in reversedFeedItems"
        :key="activityItem.id"
        :activity-item="activityItem"
        :is-original-poster="
          activityItem.User?.username === originalUserAuthorUsername ||
          activityItem.ModerationProfile?.displayName === originalModAuthorName
        "
        :related-discussion="relatedDiscussion"
        :next-revision-body="getNextRevisionBody(index)"
      />
    </ul>
  </div>
</template>
