<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { GET_COMMENT_AND_REPLIES } from "@/graphQLData/comment/queries";
import ErrorBanner from "../ErrorBanner.vue";

export default defineComponent({
  name: "CommentPermalink",
  components: {
    ErrorBanner,
  },
  setup() {
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
      if (comment.value) {
        return comment.value.ParentComment?.id
      }
      return "";
    });

    return {
      route,
      commentResult,
      commentError,
      commentLoading,
      parentCommentId,
    };
  },
});
</script>

<template>
  <div>
    <div v-if="commentLoading">
      Loading...
    </div>
    <ErrorBanner
      v-if="commentError"
      :text="commentError.message"
    />
    <div
      v-else-if="
        commentResult && commentResult.comments && commentResult.comments[0]
      "
    >
      <nuxt-link
        v-if="parentCommentId"
        class="text-xs underline"
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
      <slot
        name="comment"
        :comment-data="commentResult.comments[0]"
      />
    </div>
    <div v-else>
      <h2 class="mt-4 text-lg text-gray-500">
        Comment not found
      </h2>
    </div>
  </div>
</template>
