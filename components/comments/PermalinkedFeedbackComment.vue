<script setup lang="ts">
  import { computed } from "vue";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_FEEDBACK_COMMENT } from "@/graphQLData/comment/queries";
  import ErrorBanner from "../ErrorBanner.vue";
  import { useRoute } from "nuxt/app";

  const route = useRoute();

  const feedbackId = computed(() => route.params.feedbackId as string);

  const {
    result: commentResult,
    error: commentError,
    loading: commentLoading,
  } = useQuery(GET_FEEDBACK_COMMENT, {
    id: feedbackId,
  });
</script>

<template>
  <div class="rounded-md border border-blue-500 px-4 py-2">
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner
      v-if="commentError"
      :text="commentError.message"
    />
    <div v-else-if="commentResult && commentResult.comments && commentResult.comments[0]">
      <slot
        :comment-data="commentResult.comments[0]"
        name="comment"
      />
    </div>
    <div v-else>
      <p class="mt-4 text-lg text-gray-500">Comment not found</p>
    </div>
  </div>
</template>
