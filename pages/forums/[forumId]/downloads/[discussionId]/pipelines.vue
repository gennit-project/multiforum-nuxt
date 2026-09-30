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
  typeof route.params.discussionId === 'string' ? route.params.discussionId : ''
);
const channelName = computed(() =>
  typeof route.params.forumId === 'string' ? route.params.forumId : ''
);
const fileId = computed(
  () => props.discussion?.DownloadableFiles?.[0]?.id || ''
);
const uploaderUsername = computed(
  () =>
    (
      props.discussion?.DownloadableFiles?.[0] as
        { uploadedByUsername?: string | null } | undefined
    )?.uploadedByUsername || ''
);
const downloadName = computed(() => props.discussion?.title || 'download');
const fileName = computed(
  () => props.discussion?.DownloadableFiles?.[0]?.fileName || ''
);
</script>

<template>
  <div class="px-2 py-4">
    <nav aria-label="Breadcrumb">
      <NuxtLink
        :to="{
          name: 'forums-forumId-downloads-discussionId',
          params: { forumId: channelName, discussionId },
        }"
        class="text-brand-700 dark:text-brand-300 inline-flex items-center gap-2 text-sm font-medium hover:underline"
      >
        <span aria-hidden="true">&larr;</span>
        Back to {{ downloadName }}
      </NuxtLink>
    </nav>

    <header class="mt-5 border-b border-gray-200 pb-5 dark:border-gray-700">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
        Checks for {{ downloadName }}
      </h1>
      <p v-if="fileName" class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {{ fileName }}
      </p>
    </header>

    <PublicDownloadPipelines
      v-if="fileId && discussionId && channelName"
      :file-id="fileId"
      :discussion-id="discussionId"
      :channel-name="channelName"
      :owner-username="discussion?.Author?.username || ''"
      :uploader-username="uploaderUsername"
    />
    <div v-else class="py-8 text-center text-gray-500 dark:text-gray-400">
      Check information is unavailable for this download.
    </div>
  </div>
</template>
