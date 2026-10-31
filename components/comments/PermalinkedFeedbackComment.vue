<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetFeedbackCommentDocument as GET_FEEDBACK_COMMENT } from '@/__generated__/operations';
import ErrorBanner from '../ErrorBanner.vue';
import { useRoute } from 'nuxt/app';

const route = useRoute();

const feedbackId = computed(() =>
  typeof route.params.feedbackId === 'string' ? route.params.feedbackId : ''
);

const {
  result: commentResult,
  error: commentError,
  loading: commentLoading,
} = useQuery(
  GET_FEEDBACK_COMMENT,
  () => ({
    id: feedbackId.value,
  }),
  { enabled: computed(() => !!feedbackId.value), keepPreviousResult: false }
);
</script>

<template>
  <div class="border-brand-500 rounded-md border px-4 py-2">
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner v-if="commentError" :text="commentError.message" />
    <div
      v-else-if="
        commentResult && commentResult.comments && commentResult.comments[0]
      "
    >
      <slot name="comment" :comment-data="commentResult.comments[0]" />
    </div>
    <div v-else>
      <p class="mt-4 text-lg text-gray-500">Comment not found</p>
    </div>
  </div>
</template>
