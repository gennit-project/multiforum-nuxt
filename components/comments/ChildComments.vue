<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GetCommentWithRepliesDocument } from '@/__generated__/operations';
import LoadMore from '../LoadMore.vue';
import { getSortFromQuery } from '@/utils/getSortFromQuery';
import { useRoute } from 'nuxt/app';
import ErrorBanner from '../ErrorBanner.vue';

const PAGE_LIMIT = 5;

interface Props {
  modName: string;
  parentCommentId: string;
}

const props = defineProps<Props>();

const route = useRoute();

const activeSort = computed(() => {
  return getSortFromQuery(route.query);
});

const {
  result: commentResult,
  error: commentError,
  loading: commentLoading,
  fetchMore,
} = useQuery(GetCommentWithRepliesDocument, () => ({
  commentId: props.parentCommentId,
  modName: props.modName,
  limit: PAGE_LIMIT,
  offset: 0,
  sort: activeSort.value,
}));

const aggregateChildCommentCount = computed(() => {
  if (commentLoading.value || commentError.value) {
    return 0;
  }
  if (commentResult.value?.getCommentReplies) {
    return commentResult.value.getCommentReplies.aggregateChildCommentCount;
  }
  return 0;
});

const loadMore = () => {
  fetchMore({
    variables: {
      offset: commentResult.value?.getCommentReplies?.ChildComments.length ?? 0,
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult?.getCommentReplies) return previousResult;
      if (!previousResult.getCommentReplies) return fetchMoreResult;

      const prevCommentReplies = previousResult.getCommentReplies.ChildComments;
      const newCommentReplies = fetchMoreResult.getCommentReplies.ChildComments;

      return {
        ...previousResult,
        getCommentReplies: {
          ...previousResult.getCommentReplies,
          ChildComments: [...prevCommentReplies, ...newCommentReplies],
        },
      };
    },
  });
};

const comments = computed(() => {
  if (commentResult.value?.getCommentReplies) {
    return commentResult.value.getCommentReplies.ChildComments || [];
  }
  return [];
});

const reachedEndOfResults = computed(() => {
  if (commentLoading.value || commentError.value) {
    return false;
  }
  return (
    (commentResult.value?.getCommentReplies?.ChildComments.length ?? 0) >=
    aggregateChildCommentCount.value
  );
});
</script>
<template>
  <div class="dark:text-white">
    <ErrorBanner v-if="commentError" :text="commentError.message" />
    <div v-else>
      <slot :comments="comments" />
      <LoadMore
        v-if="!commentLoading && !reachedEndOfResults"
        class="pl-8"
        :reached-end-of-results="reachedEndOfResults"
        @load-more="loadMore"
      />
    </div>
    <div v-if="commentLoading">Loading...</div>
  </div>
</template>
