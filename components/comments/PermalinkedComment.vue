<script setup lang="ts">
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_COMMENT_AND_REPLIES } from "@/graphQLData/comment/queries";
  import ErrorBanner from "@/components/ErrorBanner.vue";
  import { useRoute } from "nuxt/app";

  const route = useRoute();
  const {
    result: commentResult,
    error: commentError,
    loading: commentLoading,
  } = useQuery(GET_COMMENT_AND_REPLIES, {
    id: route.params.commentId,
  });

  const comment = computed(() => {
    return commentResult.value?.comments[0];
  });

  const parentCommentId = computed(() => {
    return comment.value?.ParentComment?.id || "";
  });

  const discussionId = computed(() => {
    return route.params.discussionId;
  });

  const eventId = computed(() => {
    return route.params.eventId;
  });

  const parentCommentPermalink = computed(() => {
    if (parentCommentId.value) {
      if (discussionId.value) {
        return {
          name: "forums-forumId-discussions-discussionId-comments-commentId",
          params: {
            forumId: route.params.forumId,
            discussionId: route.params.discussionId,
            commentId: parentCommentId.value,
          },
        };
      }

      if (eventId.value) {
        return {
          name: "forums-forumId-events-eventId-comments-commentId",
          params: {
            forumId: route.params.forumId,
            eventId: route.params.eventId,
            commentId: parentCommentId.value,
          },
        };
      }
    }
    return null;
  });
</script>

<template>
  <div>
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner
      v-else-if="commentError"
      :text="commentError.message"
    />
    <div v-else-if="commentResult && commentResult.comments && commentResult.comments[0]">
      <nuxt-link
        v-if="parentCommentId && parentCommentPermalink"
        class="px-2 py-1 text-xs underline dark:text-white"
        :to="parentCommentPermalink"
      >
        View Context
      </nuxt-link>
      <slot
        :comment-data="commentResult.comments[0]"
        name="comment"
      />
    </div>
    <ErrorBanner
      v-else
      class="mt-2"
      text="The comment you are looking for does not exist."
      type="info"
    />
  </div>
</template>
