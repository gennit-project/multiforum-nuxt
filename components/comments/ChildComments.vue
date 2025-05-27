<script lang="ts">
import { defineComponent, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_COMMENT_REPLIES } from "@/graphQLData/comment/queries";
import LoadMore from "../LoadMore.vue";
import { getSortFromQuery } from "./getSortFromQuery";
import { useRoute } from "nuxt/app";
import ErrorBanner from "../ErrorBanner.vue";

const PAGE_LIMIT = 5;

export default defineComponent({
  components: {
    ErrorBanner,
    LoadMore,
  },
  props: {
    modName: {
      type: String,
      required: true,
    },
    parentCommentId: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const route = useRoute();

    const activeSort = computed(() => {
      return getSortFromQuery(route.query);
    });

    const {
      result: commentResult,
      error: commentError,
      loading: commentLoading,
      fetchMore,
    } = useQuery(GET_COMMENT_REPLIES, {
      commentId: props.parentCommentId,
      modName: props.modName,
      limit: PAGE_LIMIT,
      offset: 0,
      sort: activeSort,
    });

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
          offset: commentResult.value?.getCommentReplies.ChildComments.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          const prevCommentReplies =
            previousResult.getCommentReplies.ChildComments;
          const newCommentReplies =
            fetchMoreResult.getCommentReplies.ChildComments;

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
        commentResult.value?.getCommentReplies.ChildComments.length ===
        aggregateChildCommentCount.value
      );
    });

    return {
      aggregateCommentCount: 0,
      commentError,
      commentLoading,
      comments,
      loadMore,
      reachedEndOfResults,
    };
  },
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
    <div v-if="commentLoading">
      Loading...
    </div>
  </div>
</template>
