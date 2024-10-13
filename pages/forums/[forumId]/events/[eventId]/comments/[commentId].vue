<script setup lang="ts">
import { ref} from "vue";
import { useRoute } from "vue-router";
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

defineProps<{
  aggregateCommentCount: number;
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
        @start-comment-save="$emit('startCommentSave')"
        @open-reply-editor="$emit('openReplyEditor')"
        @hide-reply-editor="$emit('hideReplyEditor')"
        @open-edit-comment-editor="$emit('openEditCommentEditor')"
        @hide-edit-comment-editor="$emit('hideEditCommentEditor')"
        @click-edit-comment="$emit('clickEditComment')"
        @delete-comment="$emit('deleteComment')"
        @create-comment="$emit('createComment')"
        @update-create-reply-comment-input="
          $emit('updateCreateReplyCommentInput')
        "
        @update-edit-comment-input="$emit('updateEditCommentInput')"
        @save-edit="$emit('saveEdit')"
        @scroll-to-top="$emit('scrollToTop')"
        @click-report="$emit('clickReport')"
      />
    </template>
  </PermalinkedComment>
</template>
