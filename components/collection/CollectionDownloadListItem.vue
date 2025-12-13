<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { Discussion, DiscussionChannel } from '@/__generated__/graphql';
import { relativeTime } from '@/utils';

const props = defineProps({
  discussion: {
    type: Object as PropType<Partial<Discussion>>,
    required: true,
  },
});

const primaryChannel = computed<DiscussionChannel | null>(() => {
  return (props.discussion?.DiscussionChannels || [])[0] as DiscussionChannel | null;
});

const linkTarget = computed(() => {
  if (!primaryChannel.value?.channelUniqueName || !props.discussion?.id) {
    return '#';
  }
  return {
    name: 'forums-forumId-downloads-discussionId',
    params: {
      forumId: primaryChannel.value.channelUniqueName,
      discussionId: props.discussion.id,
    },
  };
});

const firstImage = computed(() => {
  const album = props.discussion?.Album;
  if (!album?.Images?.length) return null;
  if (album.imageOrder?.length) {
    const ordered = album.Images.find((img) => img.id === album.imageOrder?.[0]);
    if (ordered?.url) return ordered.url;
  }
  return album.Images[0]?.url || null;
});

const createdAgo = computed(() => {
  return props.discussion?.createdAt ? relativeTime(props.discussion.createdAt) : '';
});
</script>

<template>
  <li
    class="w-48 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
  >
    <nuxt-link :to="linkTarget" class="block">
      <div class="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          v-if="firstImage"
          :src="firstImage"
          :alt="discussion?.title || 'Download preview'"
          class="h-full w-full object-cover"
        >
        <div
          v-else
          class="flex h-full w-full items-center justify-center text-center text-xs text-gray-500 dark:text-gray-300"
        >
          No preview
        </div>
      </div>
      <div class="space-y-1 p-2">
        <p class="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
          {{ discussion?.title || 'Untitled download' }}
        </p>
        <p class="text-xs text-gray-600 dark:text-gray-300">
          {{ primaryChannel?.channelUniqueName || 'Unknown forum' }}
        </p>
        <p v-if="createdAgo" class="text-xs text-gray-500 dark:text-gray-400">
          {{ createdAgo }}
        </p>
      </div>
    </nuxt-link>
  </li>
</template>
