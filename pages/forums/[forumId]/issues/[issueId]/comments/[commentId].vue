<script lang="ts" setup>
import { useRoute } from "nuxt/app";
import { ref } from "vue";
import type { ApolloError } from "@apollo/client";
import PermalinkedActivityFeedItem from "@/components/mod/PermalinkedActivityFeedItem.vue";
import ActivityFeedListItem from "@/components/mod/ActivityFeedListItem.vue";

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

defineProps({
  commentInProcess: {
    type: Boolean,
    required: false,
    default: false,
  },
  editFormOpenAtCommentID: {
    type: String,
    required: false,
    default: "",
  },
  editCommentError: {
    type: Object as () => ApolloError | null | undefined,
    required: false,
    default: null,
  },
  originalPoster: {
    type: String,
    required: false,
    default: "",
  },
});
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
