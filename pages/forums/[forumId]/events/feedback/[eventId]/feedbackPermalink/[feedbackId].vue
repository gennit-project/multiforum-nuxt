<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "nuxt/app";
import CommentOnFeedbackPage from "@/components/comments/CommentOnFeedbackPage.vue";
import PermalinkedFeedbackComment from "@/components/comments/PermalinkedFeedbackComment.vue";

const route = useRoute();
const permalinkedCommentId = ref(route.params.commentId as string);

defineEmits([
    "showCopiedLinkNotification",
    "clickFeedback",
    "clickUndoFeedback",
    "clickEditFeedback",
])

</script>

<template>
  <PermalinkedFeedbackComment class="mt-2" :comment-id="permalinkedCommentId">
    <template #comment="{ commentData }">
      <CommentOnFeedbackPage
        :comment="commentData"
        :is-highlighted="true"
        @show-copied-link-notification="$emit('showCopiedLinkNotification')"
        @click-feedback="$emit('clickFeedback')"
        @click-undo-feedback="$emit('clickUndoFeedback')"
        @click-edit-feedback="$emit('clickEditFeedback')"
      />
    </template>
  </PermalinkedFeedbackComment>
</template>
