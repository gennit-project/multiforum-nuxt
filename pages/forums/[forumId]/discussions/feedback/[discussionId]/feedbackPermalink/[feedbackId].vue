<script setup lang="ts">
  import CommentOnFeedbackPage from "@/components/comments/CommentOnFeedbackPage.vue";
  import PermalinkedFeedbackComment from "@/components/comments/PermalinkedFeedbackComment.vue";
  import { defineEmits, ref } from "vue";
  import { useRoute } from "nuxt/app";

  const route = useRoute();
  const permalinkedCommentId = ref(route.params.commentId as string);

  defineEmits([
    "showCopiedLinkNotification",
    "clickFeedback",
    "clickUndoFeedback",
    "clickEditFeedback",
  ]);
</script>

<template>
  <PermalinkedFeedbackComment
    class="mt-2"
    :comment-id="permalinkedCommentId"
  >
    <template #comment="{ commentData }">
      <CommentOnFeedbackPage
        :comment="commentData"
        :is-highlighted="true"
        @click-edit-feedback="$emit('clickEditFeedback')"
        @click-feedback="$emit('clickFeedback')"
        @click-undo-feedback="$emit('clickUndoFeedback')"
        @show-copied-link-notification="$emit('showCopiedLinkNotification')"
      />
    </template>
  </PermalinkedFeedbackComment>
</template>
