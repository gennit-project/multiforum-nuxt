<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import {
  GetPermalinkedCommentDocument,
  type GetPermalinkedCommentQuery,
} from '@/__generated__/operations';
import ErrorBanner from '@/components/ErrorBanner.vue';
import { useRoute } from 'nuxt/app';

defineSlots<{
  comment(props: {
    commentData: GetPermalinkedCommentQuery['comments'][number];
  }): unknown;
}>();

const route = useRoute();
// A permalink has exactly one nonempty ID. Arrays are invalid, not coerced.
const scalarId = (value: string | string[] | undefined) =>
  typeof value === 'string' && value.trim() ? value : '';
const commentId = computed(() => scalarId(route.params.commentId));
const {
  result: commentResult,
  error: commentError,
  loading: commentLoading,
} = useQuery(
  GetPermalinkedCommentDocument,
  () => ({ id: commentId.value }),
  () => ({ enabled: !!commentId.value, keepPreviousResult: false })
);

const comment = computed(() => {
  if (!commentId.value || commentLoading.value || commentError.value)
    return undefined;
  // Apollo may briefly retain the previous result when route variables change.
  return commentResult.value?.comments?.find(
    (item) => item?.id === commentId.value
  );
});

const parentCommentId = computed(() => {
  return comment.value?.ParentComment?.id || '';
});

const discussionId = computed(() => {
  return scalarId(route.params.discussionId);
});

const eventId = computed(() => {
  return scalarId(route.params.eventId);
});

const parentCommentPermalink = computed(() => {
  if (parentCommentId.value && scalarId(route.params.forumId)) {
    if (discussionId.value) {
      return {
        name: 'forums-forumId-discussions-discussionId-comments-commentId',
        params: {
          forumId: scalarId(route.params.forumId),
          discussionId: discussionId.value,
          commentId: parentCommentId.value,
        },
      };
    }

    if (eventId.value) {
      return {
        name: 'forums-forumId-events-eventId-comments-commentId',
        params: {
          forumId: scalarId(route.params.forumId),
          eventId: eventId.value,
          commentId: parentCommentId.value,
        },
      };
    }
  }
  return null;
});
</script>

<template>
  <div data-testid="permalinked-comment">
    <div v-if="commentId && commentLoading" role="status">Loading...</div>
    <ErrorBanner
      v-else-if="commentId && commentError"
      :text="commentError.message"
    />
    <div v-else-if="comment">
      <nuxt-link
        v-if="parentCommentId && parentCommentPermalink"
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
