<script lang="ts" setup>
import { ref, watchEffect, computed } from "vue";
import DiscussionDetailContent from "@/components/discussion/detail/DiscussionDetailContent.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import "md-editor-v3/lib/style.css";
import { modProfileNameVar } from "@/cache";
import { useRoute, useHead } from "nuxt/app";
import { useQuery } from "@vue/apollo-composable";
import { GET_DISCUSSION } from "@/graphQLData/discussion/queries";
import { usePageMeta } from "@/composables/usePageMeta";

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
  onResult: onGetDiscussionResult,
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

onGetDiscussionResult((result) => {
  if (result.data.discussions.length === 0) {
    // Handle the case where the discussion is not found
    usePageMeta({
      title: `Discussion Not Found${channelId.value ? ` | ${channelId.value}` : ""}`,
      description: "The requested discussion could not be found.",
    });
    return;
  } else {
    const title = discussion.value.title || "Discussion";
    const description = discussion.value.body
      ? discussion.value.body.substring(0, 160) +
        (discussion.value.body.length > 160 ? "..." : "")
      : `View this discussion on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`;
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
    const imageUrl = discussion.value.coverImageURL || "";

    // Set basic SEO meta tags
    usePageMeta({
      title: `${title} | ${channelId.value} | ${serverName}`,
      description: description,
      image: imageUrl,
      type: "article",
    });

    // Add structured data for rich results
    useHead({
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            headline: title,
            description: description,
            author: {
              "@type": "Person",
              name:
                discussion.value.Author?.displayName ||
                discussion.value.Author?.username ||
                "Anonymous",
            },
            datePublished: discussion.value.createdAt,
            dateModified:
              discussion.value.updatedAt || discussion.value.createdAt,
            publisher: {
              "@type": "Organization",
              name: serverName,
              url: baseUrl,
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${baseUrl}/forums/${channelId.value}/discussions/${discussionId.value}`,
            },
          }),
        },
      ],
    });
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
