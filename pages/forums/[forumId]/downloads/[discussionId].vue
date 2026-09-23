<script lang="ts" setup>
import { config } from '@/config';
import { ref, computed, watchEffect } from 'vue';
import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import 'md-editor-v3/lib/style.css';
import { useModProfileName } from '@/composables/useAuthState';
import { useRoute, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_DOWNLOAD_DETAIL } from '@/graphQLData/discussion/queries';

const modProfileNameVar = useModProfileName();

const route = useRoute();

const updateDiscussionId = () => {
  if (typeof route.params.discussionId === 'string') {
    return route.params.discussionId;
  }
  return '';
};
const discussionId = ref(updateDiscussionId());

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

watchEffect(() => {
  discussionId.value = updateDiscussionId();
});

const { result: discussionResult } = useQuery(GET_DOWNLOAD_DETAIL, {
  id: discussionId,
  loggedInModName: modProfileNameVar.value,
  channelUniqueName: channelId.value,
});

const metaData = computed(() => {
  try {
    const discussions = discussionResult.value?.discussions;
    if (!discussions) {
      return {
        title: `Download | ${channelId.value}`,
        meta: [
          {
            name: 'description',
            content: `View this download on ${config.serverDisplayName}`,
          },
        ],
      };
    }
    if (discussions.length === 0) {
      return {
        title: `Download Not Found${channelId.value ? ` | ${channelId.value}` : ''}`,
        meta: [
          {
            name: 'description',
            content: 'The requested download could not be found.',
          },
        ],
      };
    }

    const download = discussions[0];
    if (!download) throw new Error('Download result is empty');
    const title = download.title || 'Download';
    const description = download.body
      ? download.body.substring(0, 160) +
        (download.body.length > 160 ? '...' : '')
      : `View this download on ${config.serverDisplayName}`;
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const serverName = config.serverDisplayName;
    const imageUrl = download.coverImageURL || '';
    const url = `${baseUrl}/forums/${channelId.value}/downloads/${discussionId.value}`;

    return {
      title: `${title} | ${channelId.value} | ${serverName}`,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: url },
        { property: 'og:site_name', content: serverName },
        ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
        {
          name: 'twitter:card',
          content: imageUrl ? 'summary_large_image' : 'summary',
        },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DigitalDocument',
            headline: title,
            description,
            author: {
              '@type': 'Person',
              name:
                download.Author?.displayName ||
                download.Author?.username ||
                'Anonymous',
            },
            datePublished: download.createdAt,
            dateModified: download.updatedAt || download.createdAt,
            publisher: {
              '@type': 'Organization',
              name: serverName,
              url: baseUrl,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': url,
            },
          }),
        },
      ],
    };
  } catch {
    return {
      title: 'Download',
      meta: [
        {
          name: 'description',
          content: `View this download on ${config.serverDisplayName}`,
        },
      ],
    };
  }
});

// Register head management while Nuxt's setup context is active. The computed
// value updates when Apollo resolves without calling useHead asynchronously.
useHead(metaData);
</script>

<template>
  <div
    class="relative mx-auto w-full flex-1 overflow-hidden p-0 focus:outline-none xl:order-last xl:max-w-6xl"
  >
    <div class="flex w-full justify-center space-y-4 overflow-x-hidden">
      <ErrorBanner v-if="!discussionId" text="Download not found" />
      <DiscussionDetailContent
        v-else
        :key="discussionId"
        :discussion-id="discussionId"
        :logged-in-user-mod-name="modProfileNameVar || ''"
        :download-mode="true"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(h1) {
  font-size: 2.65em;
  padding-bottom: 0.3em;
}
</style>
