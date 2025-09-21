<script lang="ts" setup>
import { ref, watchEffect, computed } from 'vue';
import DiscussionDetailContent from '@/components/discussion/detail/DiscussionDetailContent.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import 'md-editor-v3/lib/style.css';
import { modProfileNameVar } from '@/cache';
import { useRoute, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';

const route = useRoute();

const updateDiscussionId = () => {
  if (typeof route.params.discussionId === 'string') {
    return route.params.discussionId;
  }
  return '';
};
const discussionId = ref(updateDiscussionId());

watchEffect(() => {
  discussionId.value = updateDiscussionId();
});

const channelId = computed(() => {
  if (typeof route.params.forumId === 'string') {
    return route.params.forumId;
  }
  return '';
});

const { result: discussionResult } = useQuery(GET_DISCUSSION, {
  id: discussionId,
  loggedInModName: modProfileNameVar.value,
  channelUniqueName: channelId.value,
});

// Reactive meta data that updates when discussion data changes
const metaData = computed(() => {
  try {
    if (!discussionResult.value?.discussions) {
      return {
        title: `Discussion | ${channelId.value}`,
        description: `View this discussion on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`,
      };
    }

    if (discussionResult.value.discussions.length === 0) {
      return {
        title: `Discussion Not Found${channelId.value ? ` | ${channelId.value}` : ''}`,
        description: 'The requested discussion could not be found.',
      };
    }

    const discussion = discussionResult.value.discussions[0];
    const title = discussion.title || 'Discussion';
    const description = discussion.body
      ? discussion.body.substring(0, 160) +
        (discussion.body.length > 160 ? '...' : '')
      : `View this discussion on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`;
    const baseUrl = import.meta.env.VITE_BASE_URL;
    const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
    const imageUrl = discussion.coverImageURL || '';

    return {
      title: `${title} | ${channelId.value} | ${serverName}`,
      meta: [
        { name: 'description', content: description },

        // OpenGraph tags
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        {
          property: 'og:url',
          content: `${baseUrl}/forums/${channelId.value}/discussions/${discussionId.value}`,
        },
        { property: 'og:site_name', content: serverName },
        ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),

        // Twitter Card tags
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
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: title,
            description: description,
            author: {
              '@type': 'Person',
              name:
                discussion.Author?.displayName ||
                discussion.Author?.username ||
                'Anonymous',
            },
            datePublished: discussion.createdAt,
            dateModified: discussion.updatedAt || discussion.createdAt,
            publisher: {
              '@type': 'Organization',
              name: serverName,
              url: baseUrl,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${baseUrl}/forums/${channelId.value}/discussions/${discussionId.value}`,
            },
          }),
        },
      ],
    };
  } catch (error) {
    console.error('Error setting meta tags:', error);
    return {
      title: 'Discussion',
      meta: [
        {
          name: 'description',
          content: `View this discussion on ${import.meta.env.VITE_SERVER_DISPLAY_NAME}`,
        },
      ],
    };
  }
});

// Set meta tags reactively
useHead(metaData);
</script>

<template>
  <div
    class="relative w-full max-w-screen-2xl flex-1 overflow-hidden p-0 focus:outline-none xl:order-last"
  >
    <div class="flex w-full justify-center space-y-4 overflow-x-hidden">
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
