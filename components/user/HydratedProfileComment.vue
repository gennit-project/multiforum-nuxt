<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GetCommentDocument,
  type GetCommentQuery,
  type GetUserCommentsQuery,
} from '@/__generated__/operations';

type Summary = Pick<
  GetUserCommentsQuery['users'][number]['Comments'][number],
  'id' | 'text'
>;
const props = defineProps<{ comment: Summary }>();
defineSlots<{
  default(props: { commentData: GetCommentQuery['comments'][number] }): unknown;
}>();
const { result, loading, error, refetch } = useQuery(
  GetCommentDocument,
  () => ({ id: props.comment.id }),
  () => ({
    enabled: !!props.comment.id,
    fetchPolicy: 'cache-first',
    keepPreviousResult: false,
  })
);
const hydrated = computed(() =>
  !loading.value && !error.value
    ? result.value?.comments.find((item) => item.id === props.comment.id)
    : undefined
);
</script>

<template>
  <slot v-if="hydrated" :comment-data="hydrated" />
  <div v-else data-testid="profile-comment-summary" class="space-y-2">
    <p class="whitespace-pre-wrap">{{ comment.text }}</p>
    <p v-if="loading" role="status">Loading comment controls…</p>
    <div v-else-if="error" role="alert">
      <p>Unable to load this comment.</p>
      <button type="button" class="min-h-6 underline" @click="refetch()">
        Retry loading comment
      </button>
    </div>
    <p v-else role="status">This comment is no longer available.</p>
  </div>
</template>
