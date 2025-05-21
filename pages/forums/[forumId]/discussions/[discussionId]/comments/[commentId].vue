<script setup lang="ts">
  import { ref } from "vue";
  import { useRoute } from "nuxt/app";
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
  defineProps({
    aggregateCommentCount: {
      type: Number,
      required: true,
    },
    enableFeedback: {
      type: Boolean,
      required: true,
    },
    locked: {
      type: Boolean,
      required: true,
    },
    commentInProcess: {
      type: Boolean,
      required: false,
      default: false,
    },
    loggedInUserModName: {
      type: String,
      required: true,
    },
    replyFormOpenAtCommentID: {
      type: String,
      required: true,
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
      required: true,
    },
  });
</script>

<template>
  <PermalinkedComment
    class="mt-2"
    :comment-id="permalinkedCommentId"
  >
    <template #comment="{ commentData }">
      <Comment
        :aggregate-comment-count="aggregateCommentCount"
        :comment-data="commentData"
        :comment-in-process="commentInProcess"
        :compact="true"
        :depth="1"
        :edit-comment-error="editCommentError"
        :edit-form-open-at-comment-i-d="editFormOpenAtCommentID"
        :enable-feedback="enableFeedback"
        :is-permalinked="true"
        :locked="locked"
        :mod-profile-name="loggedInUserModName"
        :original-poster="originalPoster"
        :reply-form-open-at-comment-i-d="replyFormOpenAtCommentID"
        @click-edit-comment="$emit('clickEditComment', $event)"
        @click-feedback="$emit('clickFeedback', $event)"
        @click-report="$emit('clickReport', $event)"
        @click-undo-feedback="$emit('clickUndoFeedback', $event)"
        @create-comment="$emit('createComment', $event)"
        @click-edit-feedback="$emit('clickEditFeedback', $event)"
        @delete-comment="$emit('deleteComment', $event)"
        @handle-view-feedback="$emit('handleViewFeedback', $event)"
        @hide-edit-comment-editor="$emit('hideEditCommentEditor', $event)"
        @hide-reply-editor="$emit('hideReplyEditor', $event)"
        @open-edit-comment-editor="$emit('openEditCommentEditor', $event)"
        @open-reply-editor="$emit('openReplyEditor', $event)"
        @save-edit="$emit('saveEdit', $event)"
        @scroll-to-top="$emit('scrollToTop')"
        @show-copied-link-notification="$emit('showCopiedLinkNotification', $event)"
        @start-comment-save="$emit('startCommentSave', $event)"
        @update-create-reply-comment-input="$emit('updateCreateReplyCommentInput', $event)"
        @update-edit-comment-input="$emit('updateEditCommentInput', $event)"
        @update-feedback="$emit('updateFeedback', $event)"
      />
    </template>
  </PermalinkedComment>
</template>
