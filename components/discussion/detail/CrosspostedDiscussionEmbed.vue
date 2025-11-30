<script setup lang="ts">
import { computed } from 'vue';
import type { Discussion } from '@/__generated__/graphql';

const props = defineProps<{
  discussion: Discussion | null;
  showEmbedNotice?: boolean;
}>();

const primaryChannel = computed(() => {
  return props.discussion?.DiscussionChannels?.[0] || null;
});

const channelDisplayName = computed(() => {
  if (!primaryChannel.value) return '';
  return (
    primaryChannel.value.Channel?.displayName ||
    primaryChannel.value.channelUniqueName ||
    ''
  );
});

const bodyPreview = computed(() => {
  if (!props.discussion?.body) return '';
  const trimmedBody = props.discussion.body.trim();
  if (trimmedBody.length <= 200) return trimmedBody;
  return `${trimmedBody.slice(0, 200)}...`;
});

const discussionLink = computed(() => {
  if (!props.discussion?.id || !primaryChannel.value?.channelUniqueName) {
    return null;
  }
  return {
    name: 'forums-forumId-discussions-discussionId',
    params: {
      forumId: primaryChannel.value.channelUniqueName,
      discussionId: props.discussion.id,
    },
  };
});
</script>

<template>
  <div
    class="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="mb-2 flex items-center justify-between">
      <p class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        Crossposted Discussion
      </p>
      <span
        class="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      >
        Embedded
      </span>
    </div>
    <div class="space-y-1">
      <nuxt-link
        v-if="discussionLink"
        :to="discussionLink"
        class="block text-lg font-semibold text-gray-900 hover:underline dark:text-white"
      >
        {{ discussion?.title }}
      </nuxt-link>
      <p v-else class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ discussion?.title }}
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Posted by
        <span class="font-semibold">{{
          discussion?.Author?.displayName ||
          discussion?.Author?.username ||
          'Unknown user'
        }}</span>
        <span v-if="channelDisplayName">in {{ channelDisplayName }}</span>
      </p>
      <p
        v-if="bodyPreview"
        class="text-sm text-gray-700 dark:text-gray-200"
      >
        {{ bodyPreview }}
      </p>
      <p v-else class="text-sm text-gray-500 dark:text-gray-300">
        No description provided.
      </p>
    </div>
    <p
      v-if="showEmbedNotice"
      class="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200"
    >
      This original post will be embedded with your discussion. You cannot edit
      it here, and readers will see the embedded item after you publish.
    </p>
  </div>
</template>
