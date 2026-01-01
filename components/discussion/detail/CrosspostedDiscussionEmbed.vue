<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import type { Discussion } from '@/__generated__/graphql';

const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

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

const hasAlbum = computed(() => {
  return (
    props.discussion?.Album?.Images && props.discussion.Album.Images.length > 0
  );
});

const bodyPreview = computed(() => {
  return !!props.discussion?.body;
});
</script>

<template>
  <div
    class="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="mb-2 flex items-center justify-between">
      <p
        class="font-semibold text-xs uppercase text-gray-500 dark:text-gray-400"
      >
        Crossposted Discussion
      </p>
    </div>
    <div class="space-y-1">
      <nuxt-link
        v-if="discussionLink"
        :to="discussionLink"
        class="font-semibold block text-lg text-gray-900 hover:underline dark:text-white"
      >
        {{ discussion?.title }}
      </nuxt-link>
      <p v-else class="font-semibold text-lg text-gray-900 dark:text-white">
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
      <p v-if="bodyPreview" class="text-sm text-gray-700 dark:text-gray-200">
        <MarkdownPreview
          :text="discussion?.body || ''"
          :disable-gallery="false"
        />
      </p>
      <p v-else class="text-sm text-gray-500 dark:text-gray-300">
        No description provided.
      </p>
      <div
        v-if="hasAlbum"
        class="mt-3 overflow-hidden rounded-md bg-black text-white"
      >
        <DiscussionAlbum
          :album="discussion?.Album || null"
          :carousel-format="true"
          :expanded-view="true"
          :download-mode="false"
          :discussion-author="discussion?.Author?.username || ''"
          :discussion-id="discussion?.id || ''"
        />
      </div>
    </div>
    <p
      v-if="showEmbedNotice"
      class="bg-gray-50 mt-3 rounded-md px-3 py-2 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200"
    >
      This original post will be embedded with your discussion. You cannot edit
      it here, and readers will see the embedded item after you publish.
    </p>
  </div>
</template>
