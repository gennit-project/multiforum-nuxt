<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import type { Discussion } from '@/__generated__/graphql';
import PublicDownloadPipelines from '@/components/plugins/PublicDownloadPipelines.vue';
import { useRouteDiscussionNumber } from '@/composables/useRouteContentIds';
import { getDownloadRoute } from '@/utils/contentUrls';

const props = defineProps<{
  discussion?: Discussion;
}>();

const route = useRoute();
// The route param is `{number}-{slug}`; the global id comes from the discussion
// the parent download page already loaded and passes in.
const discussionId = computed(() => props.discussion?.id ?? '');
const discussionNumber = useRouteDiscussionNumber();
const backToDownloadRoute = computed(() =>
  getDownloadRoute({
    forumId: channelName.value,
    discussionNumber: discussionNumber.value,
    title: props.discussion?.title,
    discussionId: discussionId.value,
  })
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
        :to="backToDownloadRoute"
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
      event-type="downloadableFile.created"
      :discussion-id="discussionId"
      :discussion-number="discussionNumber"
      :discussion-title="discussion?.title"
      :channel-name="channelName"
      :owner-username="discussion?.Author?.username || ''"
      :uploader-username="uploaderUsername"
    />
    <div v-else class="py-8 text-center text-gray-500 dark:text-gray-400">
      Check information is unavailable for this download.
    </div>
  </div>
</template>
