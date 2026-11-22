<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GetPermalinkedCommentDocument,
  type GetPermalinkedCommentQuery,
} from '@/__generated__/operations';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { useRoute } from 'nuxt/app';
import { useResolvedCommentId } from '@/composables/useRouteContentIds';
import {
  getPermalinkToDiscussionComment,
  getPermalinkToEventComment,
} from '@/utils/routerUtils';

defineSlots<{
  comment(props: {
    commentData: GetPermalinkedCommentQuery['comments'][number];
  }): unknown;
}>();

const route = useRoute();
// A permalink has exactly one nonempty ID. Arrays are invalid, not coerced.
const scalarId = (value: string | string[] | undefined) =>
  typeof value === 'string' && value.trim() ? value : '';
// The route's commentId is the comment's shortId. Resolve it to the global id
// the comment query is keyed by. When the lookup finds nothing, try the param
// itself as a raw id so links built from data that lacks a shortId still work.
const routeCommentId = computed(() => scalarId(route.params.commentId));
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
  result: commentResult,
  error: commentError,
  loading: commentQueryLoading,
} = useQuery(
  GetPermalinkedCommentDocument,
  () => ({ id: commentId.value }),
  () => ({ enabled: !!commentId.value, keepPreviousResult: false })
);
const commentLoading = computed(
  () =>
    !!routeCommentId.value &&
    (resolvingCommentId.value || commentQueryLoading.value)
);

const comment = computed(() => {
  if (!commentId.value || commentLoading.value || commentError.value)
    return undefined;
  // Apollo may briefly retain the previous result when route variables change.
  return commentResult.value?.comments?.find(
    (item) =>
      item?.id === commentId.value &&
      (item.shortId === routeCommentId.value ||
        item.id === routeCommentId.value)
  );
});

const parentComment = computed(() => comment.value?.ParentComment ?? null);

const discussionSegment = computed(() => {
  return scalarId(route.params.discussionId);
});

const eventSegment = computed(() => {
  return scalarId(route.params.eventId);
});

// The route's discussionId / eventId params already carry the short-URL
// segment, so the context link reuses it verbatim.
const parentCommentPermalink = computed(() => {
  const forumId = scalarId(route.params.forumId);
  const parent = parentComment.value;
  if (parent?.id && forumId) {
    if (discussionSegment.value) {
      return getPermalinkToDiscussionComment({
        forumId,
        discussionId: discussionSegment.value,
        shortId: parent.shortId,
        commentId: parent.id,
      });
    }

    if (eventSegment.value) {
      return getPermalinkToEventComment({
        forumId,
        eventId: eventSegment.value,
        shortId: parent.shortId,
        commentId: parent.id,
      });
    }
  }
  return null;
});
</script>

<template>
  <div data-testid="permalinked-comment">
    <div v-if="commentLoading" role="status">Loading...</div>
    <ErrorBanner
      v-else-if="routeCommentId && commentError"
      :text="commentError.message"
    />
    <div v-else-if="comment">
      <nuxt-link
        v-if="parentComment?.id && parentCommentPermalink"
        class="px-2 py-1 text-xs underline dark:text-white"
        :to="parentCommentPermalink"
      >
        View Context
      </nuxt-link>
      <slot name="comment" :comment-data="comment" />
    </div>
    <ErrorBanner
      v-else
      class="mt-2"
      type="info"
      text="The comment you are looking for does not exist."
    />
  </div>
</template>
