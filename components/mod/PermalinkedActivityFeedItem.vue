<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetActivityFeedCommentDocument as GET_ACTIVITY_FEED_COMMENT } from '@/__generated__/operations';
import ErrorBanner from '../ErrorBanner.vue';
import { useRoute } from 'nuxt/app';
import { useResolvedCommentId } from '@/composables/useRouteContentIds';

const route = useRoute();

const routeCommentId = computed(() =>
  typeof route.params.commentId === 'string' ? route.params.commentId : ''
);

// The route's commentId is the comment shortId; resolve it to the global id
// the activity query is keyed by. If the lookup finds nothing, try the param
// as a raw id so legacy links keep working.
const {
  id: resolvedCommentId,
  loading: resolvingCommentId,
  notFound: commentIdNotFound,
} = useResolvedCommentId();
const commentId = computed(
  () =>
    resolvedCommentId.value ||
    (commentIdNotFound.value ? routeCommentId.value : '')
);

const {
  result: queryResult,
  error: commentError,
  loading: queryLoading,
} = useQuery(
  GET_ACTIVITY_FEED_COMMENT,
  () => ({
    id: commentId.value,
  }),
  () => ({ enabled: !!commentId.value })
);
const commentResult = computed(() =>
  commentId.value ? queryResult.value : null
);
const commentLoading = computed(
  () => resolvingCommentId.value || queryLoading.value
);

const moderationAction = computed(() => {
  if (!commentResult.value?.comments) return null;
  return commentResult.value?.comments?.[0]?.ModerationAction?.[0] || null;
});
</script>

<template>
  <div class="my-2 rounded-md px-4 py-2">
    <span class="text-brand-500 text-sm font-semibold"
      >Permalinked Comment</span
    >
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner v-if="commentError" :text="commentError.message" />

    <div v-else-if="moderationAction">
      <slot name="moderation-action" :moderation-action="moderationAction" />
    </div>
    <div v-else>
      <p class="mt-4 text-lg text-gray-500">Mod action not found</p>
    </div>
  </div>
</template>
