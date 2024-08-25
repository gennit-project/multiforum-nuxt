<script lang="ts">
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@vue/apollo-composable";
import { GET_FEEDBACK_COMMENT } from "@/graphQLData/comment/queries";
import ErrorBanner from "../ErrorBanner.vue";

export default defineComponent({
  name: "CommentPermalink",
  components: {
    ErrorBanner,
  },
    props: {
        commentId: {
        type: String,
        required: true,
        },
    },
  setup(props) {
    const route = useRoute();
    const {
      result: commentResult,
      error: commentError,
      loading: commentLoading,
    } = useQuery(GET_FEEDBACK_COMMENT, {
      id: props.commentId,
    });

    const parentCommentId = computed(() => {
      const comment = commentResult.value?.comments[0]
      if (comment && comment.ParentComment) {
        return comment.ParentComment.id
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
  <div class="border border-blue-500 px-4 py-2 rounded-md">
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
