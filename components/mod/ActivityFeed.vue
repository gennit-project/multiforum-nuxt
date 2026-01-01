<script lang="ts" setup>
import { computed } from 'vue';
import type { Discussion, ModerationAction } from '@/__generated__/graphql';
import ActivityFeedListItem from './ActivityFeedListItem.vue';
import { ActionType } from '@/types/Comment';

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
    const item = items[i] as ModerationAction & {
      Revision?: { body?: string };
    };
    if (item.Revision?.body) {
      return item.Revision.body;
    }
  }
  // No next revision found - this is the most recent edit, use current discussion body
  return null;
};

// For comment edits, calculate the edit index (0 = most recent, 1 = second most recent, etc.)
// This is used to get the correct old/new versions from the comment's PastVersions
const getCommentEditIndex = (currentIndex: number): number | null => {
  const items = reversedFeedItems.value;
  const currentItem = items[currentIndex] as ModerationAction & {
    Comment?: { PastVersions?: Array<{ id: string }> };
  };

  // Only applies to Edit actions with a Comment that has PastVersions
  if (
    currentItem.actionType !== ActionType.Edit ||
    !currentItem.Comment?.PastVersions?.length
  ) {
    return null;
  }

  // Count how many comment edit actions come AFTER this one (are more recent)
  // in the reversed list (which is chronological order)
  let editIndex = 0;
  for (let i = currentIndex + 1; i < items.length; i++) {
    const item = items[i] as ModerationAction & {
      Comment?: { id: string };
    };
    // Count edits on the same comment
    if (
      item.actionType === 'Edit' &&
      item.Comment?.id === currentItem.Comment?.id
    ) {
      editIndex++;
    }
  }
  return editIndex;
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
        :comment-edit-index="getCommentEditIndex(index)"
      />
    </ul>
  </div>
</template>
