<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_COMMENT_AND_REPLIES } from "@/graphQLData/comment/queries";
import ErrorBanner from "@/components/ErrorBanner.vue";

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
</script>

<template>
  <div>
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner v-else-if="commentError" :text="commentError.message" />
    <div v-else-if="commentResult && commentResult.comments && commentResult.comments[0]">
      <nuxt-link
        v-if="parentCommentId"
        class="text-xs underline px-2 py-1"
        :to="{
          name: 'forums-forumId-discussions-discussionId-comments-commentId',
          params: {
            forumId: route.params.forumId,
            discussionId: route.params.discussionId,
            commentId: parentCommentId,
          },
        }"
      >
        View Context
      </nuxt-link>
      <slot name="comment" :comment-data="commentResult.comments[0]" />
    </div>
    <ErrorBanner
      v-else
      class="mt-2"
      type="info"
      text="The comment you are looking for does not exist."
    />
  </div>
</template>