<script setup lang="ts">
  import { computed } from "vue";
  import { useRoute } from "nuxt/app";
  import { useQuery } from "@vue/apollo-composable";
  import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
  import { modProfileNameVar } from "@/cache";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import ErrorBanner from "@/components/ErrorBanner.vue";

  const route = useRoute();

  const discussionId = computed(() => {
    return typeof route.params.discussionId === "string" ? route.params.discussionId : "";
  });

  const channelId = computed(() => {
    return typeof route.params.forumId === "string" ? route.params.forumId : "";
  });

  const {
    result: getDiscussionResult,
    loading,
    error,
  } = useQuery(GET_DISCUSSION, {
    id: discussionId,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  });

  const discussion = computed(() => getDiscussionResult.value?.discussions[0] || null);
  const bodyText = computed(() => discussion.value?.body || "");
</script>

<template>
  <div class="px-2">
    <LoadingSpinner
      v-if="loading"
      class="flex justify-center py-4"
      :loading-text="'Loading description...'"
    />
    <ErrorBanner
      v-else-if="error"
      :text="error.message"
    />
    <div
      v-else-if="discussion?.body"
      class="rounded"
    >
      <MarkdownPreview
        :disable-gallery="false"
        :text="bodyText"
        :word-limit="1000"
      />
    </div>
    <div
      v-else
      class="py-8 text-center text-gray-500 dark:text-gray-400"
    >
      No description available for this download.
    </div>
  </div>
</template>
