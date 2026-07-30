<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import type { Discussion } from '@/__generated__/graphql';
import PublicDownloadPipelines from '@/components/plugins/PublicDownloadPipelines.vue';

const props = defineProps<{
  discussion?: Discussion;
}>();

const route = useRoute();
const discussionId = computed(() =>
  typeof route.params.discussionId === 'string'
    ? route.params.discussionId
    : ''
);
const channelName = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const fileId = computed(
  () => props.discussion?.DownloadableFiles?.[0]?.id || ''
);
</script>

<template>
  <PublicDownloadPipelines
    v-if="fileId && discussionId && channelName"
    :file-id="fileId"
    :discussion-id="discussionId"
    :channel-name="channelName"
  />
  <div v-else class="px-2 py-8 text-center text-gray-500 dark:text-gray-400">
    Pipeline information is unavailable for this download.
  </div>
</template>
