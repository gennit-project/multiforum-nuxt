<script lang="ts" setup>
import { useRoute } from "nuxt/app";
import { ref } from "vue";
import type { ApolloError } from "@apollo/client";
import PermalinkedActivityFeedItem from "@/components/mod/PermalinkedActivityFeedItem.vue";

const route = useRoute();
const permalinkedCommentId = ref(route.params.commentId);

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

defineProps<{
  aggregateCommentCount: number;
  commentInProcess: boolean;
  editFormOpenAtCommentID: string;
  editCommentError: ApolloError | null | undefined;
  originalPoster: string;
}>();
</script>

<template>
  <PermalinkedActivityFeedItem class="mt-2" :comment-id="permalinkedCommentId">
    <template #moderation-action="{ moderationAction }">
      <ActivityFeedListItem
        :key="moderationAction.id"
        :activity-item="moderationAction"
      />
    </template>
  </PermalinkedActivityFeedItem>
</template>
