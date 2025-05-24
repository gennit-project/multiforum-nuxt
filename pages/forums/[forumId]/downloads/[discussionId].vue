<script lang="ts" setup>
  import { ref, computed } from "vue";
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

  const channelId = computed(() => {
    if (typeof route.params.forumId === "string") {
      return route.params.forumId;
    }
    return "";
  });

  const { onResult: onGetDownloadResult } = useQuery(GET_DISCUSSION, {
    id: discussionId,
    loggedInModName: modProfileNameVar.value,
    channelUniqueName: channelId.value,
  });

  onGetDownloadResult((result) => {
    try {
      if (!result?.data?.discussions) {
        return;
      }
      if (result.data.discussions.length === 0) {
        // Handle the case where the download is not found
        useHead({
          title: `Download Not Found${channelId.value ? ` | ${channelId.value}` : ""}`,
          description: "The requested download could not be found.",
        });
        return;
      } else {
        const download = result.data.discussions[0];
        const title = download.title || "Download";
        const description = download.body
          ? download.body.substring(0, 160) + (download.body.length > 160 ? "..." : "")
          : `View this download on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`;
        const baseUrl = import.meta.env.VITE_BASE_URL;
        const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
        const imageUrl = download.coverImageURL || "";

        // Set all meta tags using useHead
        useHead({
          title: `${title} | ${channelId.value} | ${serverName}`,
          meta: [
            { name: "description", content: description },

            // OpenGraph tags
            { property: "og:title", content: title },
            { property: "og:description", content: description },
            { property: "og:type", content: "article" },
            {
              property: "og:url",
              content: `${baseUrl}/forums/${channelId.value}/downloads/${discussionId.value}`,
            },
            { property: "og:site_name", content: serverName },
            ...(imageUrl ? [{ property: "og:image", content: imageUrl }] : []),

            // Twitter Card tags
            { name: "twitter:card", content: imageUrl ? "summary_large_image" : "summary" },
            { name: "twitter:title", content: title },
            { name: "twitter:description", content: description },
            ...(imageUrl ? [{ name: "twitter:image", content: imageUrl }] : []),
          ],
          script: [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "DigitalDocument",
                headline: title,
                description: description,
                author: {
                  "@type": "Person",
                  name: download.Author?.displayName || download.Author?.username || "Anonymous",
                },
                datePublished: download.createdAt,
                dateModified: download.updatedAt || download.createdAt,
                publisher: {
                  "@type": "Organization",
                  name: serverName,
                  url: baseUrl,
                },
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `${baseUrl}/forums/${channelId.value}/downloads/${discussionId.value}`,
                },
              }),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error setting meta tags:", error);
      useHead({
        title: "Download",
        meta: [
          {
            name: "description",
            content: `View this download on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`,
          },
        ],
      });
    }
  });
</script>

<template>
  <div
    class="relative w-full max-w-screen-2xl flex-1 overflow-hidden p-0 focus:outline-none xl:order-last"
  >
    <div class="flex w-full justify-center space-y-4 overflow-x-hidden">
      <ErrorBanner
        v-if="!discussionId"
        text="Download not found"
      />
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
