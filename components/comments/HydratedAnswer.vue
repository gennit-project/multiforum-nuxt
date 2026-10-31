<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GetCommentDocument,
  type GetCommentQuery,
} from '@/__generated__/operations';
import type { AnswerSummary } from '@/types/DiscussionPresentation';

const props = defineProps<{ answer: AnswerSummary }>();
defineSlots<{
  default(props: {
    commentData: GetCommentQuery['comments'][number];
  }): unknown;
}>();
const { result, loading, error, refetch } = useQuery(
  GetCommentDocument,
  () => ({ id: props.answer.id }),
  () => ({
    enabled: !!props.answer.id,
    fetchPolicy: 'cache-first',
    keepPreviousResult: false,
  })
);
const comment = computed(() =>
  !loading.value && !error.value
    ? result.value?.comments.find((item) => item.id === props.answer.id)
    : undefined
);
</script>

<template>
  <slot v-if="comment" :comment-data="comment" />
  <div v-else data-testid="answer-summary" class="space-y-2">
    <p class="whitespace-pre-wrap">{{ answer.text }}</p>
    <p v-if="loading" role="status">Loading answer controls…</p>
    <div v-else-if="error" role="alert">
      <p>Unable to load this answer.</p>
      <button type="button" class="min-h-6 underline" @click="refetch()">
        Retry loading answer
      </button>
    </div>
    <p v-else role="status">This answer is no longer available.</p>
  </div>
</template>
