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
</script>

<template>
<<<<<<< HEAD
  <div class="my-2 rounded-md px-4 py-2">
    <span class="font-semibold text-sm text-orange-500">Permalinked Comment</span>
=======
  <div class="px-4 py-2 my-2 rounded-md">
    <span class="text-sm text-blue-500 font-semibold">Permalinked Comment</span>
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    <div v-if="commentLoading">Loading...</div>
    <ErrorBanner v-if="commentError" :text="commentError.message" />

    <div v-else-if="moderationAction">
      <slot name="moderation-action" :moderation-action="moderationAction" />
    </div>
    <div v-else>
      <p class="mt-4 text-lg text-gray-500">Mod action not found</p>
    </div>
  </div>
</template>
