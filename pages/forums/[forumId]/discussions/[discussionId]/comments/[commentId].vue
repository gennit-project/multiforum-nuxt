<script setup lang="ts">
import { ref} from "vue";
import { useRoute } from "vue-router";
import PermalinkedComment from "@/components/comments/PermalinkedComment.vue";
import Comment from "@/components/comments/Comment.vue";
import type { ApolloError } from "@apollo/client";

const route = useRoute();
const permalinkedCommentId = ref(route.params.commentId);
defineEmits([
  "clickEditComment",
  "clickEditFeedback",
  "clickFeedback",
  "clickReport",
  "clickUndoFeedback",
  "createComment",
  "deleteComment",
  "handleViewFeedback",
  "hideEditCommentEditor",
  "hideReplyEditor",
  "startCommentSave",
  "openEditCommentEditor",
  "openReplyEditor",
  "saveEdit",
  "scrollToTop",
  "updateCreateReplyCommentInput",
  "updateEditCommentInput",
  "updateFeedback",
  "showCopiedLinkNotification",
]);

defineProps<{
  aggregateCommentCount: number;
  enableFeedback: boolean;
  locked: boolean;
  commentInProcess: boolean;
  loggedInUserModName: string;
  replyFormOpenAtCommentID: string;
  editFormOpenAtCommentID: string;
  editCommentError: ApolloError | null | undefined;
  originalPoster: string;
}>();
</script>

<template>
  <PermalinkedComment class="mt-2" :comment-id="permalinkedCommentId">
    <template #comment="{ commentData }">
      <Comment
        :aggregate-comment-count="aggregateCommentCount"
        :compact="true"
        :comment-data="commentData"
        :enable-feedback="enableFeedback"
        :depth="1"
        :locked="locked"
        :comment-in-process="commentInProcess"
        :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
        :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
        :edit-comment-error="editCommentError"
        :mod-profile-name="loggedInUserModName"
        :original-poster="originalPoster"
        :is-permalinked="true"
        @start-comment-save="$emit('startCommentSave', $event)"
        @open-reply-editor="$emit('openReplyEditor', $event)"
        @hide-reply-editor="$emit('hideReplyEditor', $event)"
        @open-edit-comment-editor="$emit('openEditCommentEditor', $event)"
        @hide-edit-comment-editor="$emit('hideEditCommentEditor', $event)"
        @click-edit-comment="$emit('clickEditComment', $event)"
        @delete-comment="$emit('deleteComment', $event)"
        @create-comment="$emit('createComment', $event)"
        @update-create-reply-comment-input="
          $emit('updateCreateReplyCommentInput', $event)
        "
        @update-edit-comment-input="$emit('updateEditCommentInput')"
        @save-edit="$emit('saveEdit', $event)"
        @scroll-to-top="$emit('scrollToTop')"
        @click-report="$emit('clickReport', $event)"
        @click-feedback="$emit('clickFeedback', $event)"
        @click-undo-feedback="$emit('clickUndoFeedback', $event)"
        @click-edit-feedback="$emit('clickEditFeedback', $event)"
        @update-feedback="$emit('updateFeedback', $event)"
        @handle-view-feedback="$emit('handleViewFeedback', $event)"
        @show-copied-link-notification="$emit('showCopiedLinkNotification', $event)"
      />
    </template>
  </PermalinkedComment>
</template>
