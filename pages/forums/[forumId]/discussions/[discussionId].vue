<script lang="ts" setup>
import { ref, watchEffect, computed } from "vue";
import DiscussionDetailContent from "@/components/discussion/detail/DiscussionDetailContent.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import "md-editor-v3/lib/style.css";
import { modProfileNameVar } from "@/cache";
import { useRoute, useHead } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";

const route = useRoute();

const updateDiscussionId = () => {
  if (typeof route.params.discussionId === "string") {
    return route.params.discussionId;
  }
  return "";
};
const discussionId = ref(updateDiscussionId());

watchEffect(() => {
  discussionId.value = updateDiscussionId();
});

const channelId = computed(() => {
  if (typeof route.params.forumId === "string") {
    return route.params.forumId;
  }
  return "";
});

const {
  result: getDiscussionResult,
  error: getDiscussionError,
  loading: getDiscussionLoading,
} = useQuery(GET_DISCUSSION, {
  id: discussionId,
  loggedInModName: modProfileNameVar.value,
  channelUniqueName: channelId.value,
});

const discussion = computed(() => {
  if (getDiscussionLoading.value || getDiscussionError.value) {
    return null;
  }
  return getDiscussionResult.value?.discussions[0];
});

// SEO meta tags
useHead(() => {
  if (!discussion.value) {
    return {
      title: 'Discussion Not Found',
      meta: [
        { name: 'description', content: 'The requested discussion could not be found.' }
      ]
    };
  }
try {
  const title = discussion.value.title || 'Discussion';
  const description = discussion.value.body 
    ? discussion.value.body.substring(0, 160) + (discussion.value.body.length > 160 ? '...' : '')
    : `View this discussion on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`;
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
  const author = discussion.value.author?.username || 'Unknown Author';

    return {
      title: `${title} | ${serverName}`,
    meta: [
      { name: 'description', content: description },
      // Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: `${baseUrl}/forums/${channelId.value}/discussions/${discussionId.value}` },
      { property: 'og:site_name', content: serverName },
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { property: 'article:author', content: author },
      { property: 'article:section', content: channelId.value }
    ]
  };
  } catch (error) {
    console.error("Error setting meta tags:", error);
    return {
      title: 'Discussion',
      meta: [
        { name: 'description', content: `View this discussion on ${import.meta.env.VITE_SERVER_NAME}` }
      ]
    };
  }
});
</script>

<template>
  <div
    class="relative max-w-screen-2xl p-0 flex-1 focus:outline-none xl:order-last"
  >
    <div class="flex w-full justify-center space-y-4">
      <ErrorBanner v-if="!discussionId" text="Discussion not found" />
      <DiscussionDetailContent
        v-else
        :key="discussionId"
        :discussion-id="discussionId"
        :logged-in-user-mod-name="modProfileNameVar || ''"
      />
    </div>
  </div>
</template>

<style>
h1 {
  font-size: 2.65em;
  padding-bottom: 0.3em;
}
</style>
