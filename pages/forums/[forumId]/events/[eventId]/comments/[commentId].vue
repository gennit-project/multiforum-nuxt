<script setup lang="ts">
import { ref } from "vue";
import type { ApolloError } from "@apollo/client/core";
import { useRoute } from "nuxt/app";
import Comment from "@/components/comments/Comment.vue";
import PermalinkedComment from "@/components/comments/PermalinkedComment.vue";

const route = useRoute();
const permalinkedCommentId = ref(route.params.commentId);

defineEmits([
  "clickEditComment",
  "clickReport",
  "createComment",
  "deleteComment",
  "hideEditCommentEditor",
  "hideReplyEditor",
  "startCommentSave",
  "openEditCommentEditor",
  "openReplyEditor",
  "saveEdit",
  "scrollToTop",
  "updateCreateReplyCommentInput",
  "updateEditCommentInput",
]);

defineProps({
  aggregateCommentCount: {
    type: Number,
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
    required: false,
    default: "",
  },
});
</script>

<template>
  <PermalinkedComment class="mt-2" :comment-id="permalinkedCommentId">
    <template #comment="{ commentData }">
      <Comment
        :aggregate-comment-count="aggregateCommentCount"
        :compact="true"
        :comment-data="commentData"
        :enable-feedback="false"
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
        @update-edit-comment-input="$emit('updateEditCommentInput', $event)"
        @save-edit="$emit('saveEdit', $event)"
        @scroll-to-top="$emit('scrollToTop', $event)"
        @click-report="$emit('clickReport', $event)"
      />
    </template>
  </PermalinkedComment>
</template>
