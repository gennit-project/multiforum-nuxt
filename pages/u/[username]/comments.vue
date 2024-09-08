<script lang="ts">
import { defineComponent, computed } from "vue";
import { GET_USER, GET_USER_COMMENTS } from "@/graphQLData/user/queries";
import { useQuery } from "@vue/apollo-composable";
import Comment from "@/components/comments/Comment.vue";
import { useRoute } from "vue-router";

const PAGE_LIMIT = 25;

export default defineComponent({
  name: "DownvotedComments",
  components: {
    Comment,
    LoadMore,
  },
  setup() {
    const route = useRoute();

    const username = computed(() => {
      if (typeof route.params.username === "string") {
        return route.params.username;
      }
      return "";
    });

    const { result: userResult, loading: getUserLoading, error: getUserError } = useQuery(GET_USER, () => ({
      username: username.value,
    }));

    const user = computed(() => {
      if (getUserLoading.value || getUserError.value) {
        return null;
      }
      if (userResult.value && userResult.value.users.length > 0) {
        return userResult.value.users[0];
      }
      return null;
    });

    const commentsAggregate = computed(() => {
      if (user.value) {
        return user.value.CommentsAggregate.count;
      }
      return 0;
    });

    const { result: commentResult, loading, error, fetchMore } = useQuery(
      GET_USER_COMMENTS,
      () => ({
        username: username.value,
        limit: PAGE_LIMIT,
        offset: 0,
      }),
    );

    const loadMore = () => {
      fetchMore({
        variables: {
          limit: PAGE_LIMIT,
          offset: commentResult.value.users[0].Comments.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;
          return {
            users: [
              {
                ...previousResult.users[0],
                Comments: [
                  ...previousResult.users[0].Comments,
                  ...fetchMoreResult.users[0].Comments,
                ],
              },
            ],
          };
        },
      });
    };

    return {
      commentsAggregate,
      loading,
      error,
      commentResult,
      loadMore,
    };
  },
});
</script>
<template>
  <div class="py-3">
    <div v-if="error">
      Error
    </div>
    <div v-else-if="commentResult?.users?.length === 0 || commentResult?.users[0]?.Comments.length === 0">
      No comments yet
    </div>
    <div v-else-if="commentResult && commentResult?.users?.length > 0">
      <Comment
        v-for="comment in commentResult.users[0].Comments"
        :key="comment.id"
        :comment-data="comment"
        :parent-comment-id="
          comment.ParentComment ? comment.ParentComment.id : null
        "
        :depth="0"
        :show-channel="true"
        :show-context-link="true"
        :go-to-permalink-on-click="true"
      />
    </div>
    <div v-if="loading">
      Loading...
    </div>
    <div v-if="commentResult?.users[0]?.Comments.length > 0">
      <LoadMore
        class="justify-self-center"
        :reached-end-of-results="
          commentsAggregate === commentResult.users[0].Comments.length
        "
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
