<script setup lang="ts">
import { computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import { GET_ACTIVITY_FEED_COMMENT } from "@/graphQLData/comment/queries";
import ErrorBanner from "../ErrorBanner.vue";
import { useRoute } from "nuxt/app";

const route = useRoute();

const commentId = computed(() => route.params.commentId as string);

const {
  result: commentResult,
  error: commentError,
  loading: commentLoading,
} = useQuery(GET_ACTIVITY_FEED_COMMENT, {
  id: commentId,
});

const moderationAction = computed(() => {
  if (!commentResult.value?.comments) return null;
  return commentResult.value?.comments[0]?.ModerationAction;
});
console.log('action',moderationAction.value);
console.log('trying to render permalinked issue activity feed item')
</script>

<template>
  <div class="border border-blue-500 px-4 py-2 rounded-md">
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner v-if="commentError" :text="commentError.message" />
    
    <div
      v-else-if="moderationAction"
    >
      <slot name="moderation-action" :moderation-action="moderationAction" />
    </div>
    <div v-else>
      <p class="mt-4 text-lg text-gray-500">Comment not found</p>
    </div>
    <div>
      {{ 
        commentResult
       }}
    </div>
  </div>
</template>
