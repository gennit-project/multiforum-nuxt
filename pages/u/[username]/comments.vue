<script setup lang="ts">
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { useRoute } from "nuxt/app";
  import ArchivedCommentText from "@/components/comments/ArchivedCommentText.vue";
  import { GET_USER, GET_USER_COMMENTS } from "@/graphQLData/user/queries";
  import Comment from "@/components/comments/Comment.vue";

  const PAGE_LIMIT = 25;

  const route = useRoute();

  const username = computed(() => {
    return typeof route.params.username === "string" ? route.params.username : "";
  });

  const {
    result: userResult,
    loading: getUserLoading,
    error: getUserError,
  } = useQuery(GET_USER, () => ({
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
    return user.value ? user.value.CommentsAggregate.count : 0;
  });

  const {
    result: commentResult,
    loading,
    error,
    fetchMore,
  } = useQuery(
    GET_USER_COMMENTS,
    () => ({
      username: username.value,
      limit: PAGE_LIMIT,
      offset: 0,
    }),
    {
      fetchPolicy: "cache-first",
    }
  );

  const loadMore = () => {
    if (!commentResult.value?.users?.[0]?.Comments) return;

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
              Comments: [...previousResult.users[0].Comments, ...fetchMoreResult.users[0].Comments],
            },
          ],
        };
      },
    });
  };

  const isCommentOnDeletedEvent = (comment) => {
    // If the comment was on a deleted discussion, the DiscussionChannel would still be there
    // because DiscussionChannels are not deleted along with the discussion, and comments
    // are attached to the DiscussionChannel. However, if a comment was on a deleted event,
    // the Event would be null, and the DiscussionChannel would be null. So this is how we
    // infer that the comment was on a deleted event.
    return comment.Event === null && comment.DiscussionChannel === null;
  };
</script>

<template>
  <div class="py-3 dark:text-white">
    <div v-if="error">Error</div>
    <div
      v-else-if="
        commentResult?.users?.length === 0 || commentResult?.users[0]?.Comments.length === 0
      "
    >
      No comments yet
    </div>
    <div v-else-if="commentResult && commentResult?.users?.length > 0">
      <div
        v-for="comment in commentResult.users[0].Comments"
        :key="comment.id"
        class="space-y-4"
      >
        <Comment
          v-if="!comment.archived"
          :comment-data="comment"
          :depth="0"
          :go-to-permalink-on-click="true"
          :parent-comment-id="comment.ParentComment ? comment.ParentComment.id : null"
          :show-channel="true"
          :show-context-link="true"
        />
        <ArchivedCommentText
          v-if="comment?.archived"
          :channel-id="comment.Channel?.uniqueName"
          :comment-id="comment.id"
        />
        <InfoBanner
          v-if="isCommentOnDeletedEvent(comment)"
          class="my-2 ml-10"
          :text="'This comment was on an event that has been deleted.'"
          type="warning"
        />
      </div>
    </div>
    <div v-if="loading">Loading...</div>
    <div v-if="commentResult?.users[0]?.Comments.length > 0">
      <LoadMore
        class="justify-self-center"
        :reached-end-of-results="commentsAggregate === commentResult.users[0].Comments.length"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
