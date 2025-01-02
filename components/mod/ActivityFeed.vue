<script lang="ts" setup>
import { computed } from "vue";
import type { ModerationAction } from "@/__generated__/graphql";
import ActivityFeedListItem from "./ActivityFeedListItem.vue";
import type { ApolloError } from "@apollo/client";

defineEmits([
  "clickEditComment",
  "clickReport",
  "deleteComment",
  "hideEditCommentEditor",
  "hideReplyEditor",
  "startCommentSave",
  "openEditCommentEditor",
  "saveEdit",
  "updateEditCommentInput",
  "showCopiedLinkNotification",
]);

const props = defineProps<{
  feedItems: ModerationAction[];
  label: string;
  aggregateCommentCount: number;
  commentInProcess: boolean;
  editFormOpenAtCommentID: string;
  editCommentError: ApolloError | null | undefined;
  originalPoster: string;
}>();

const reversedFeedItems = computed(() => {
  return props.feedItems.slice().reverse();
});
</script>

<template>
  <div class="flow-root">
    <div class="border border-blue-500">
      <NuxtPage
        :aggregate-comment-count="aggregateCommentCount"
        :comment-in-process="commentInProcess"
        :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
        :edit-comment-error="editCommentError"
        :original-poster="originalPoster"
      />
    </div>
    <ul role="list" class="-mb-8">
      <ActivityFeedListItem
        v-for="activityItem in reversedFeedItems"
        :key="activityItem.id"
        :activity-item="activityItem"
      />
    </ul>
  </div>
</template>
