<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_DISCUSSION } from '@/graphQLData/discussion/queries';
import { useModProfileName } from '@/composables/useAuthState';
import DiscussionTitleVersions from '@/components/discussion/detail/activityFeed/DiscussionTitleVersions.vue';
import LabelChangeHistory from '@/components/discussion/detail/activityFeed/LabelChangeHistory.vue';
import type { Discussion } from '@/__generated__/graphql';
import { useSharedDownloadPipelineOverview } from '@/composables/useDownloadPipelineOverview';

const modProfileNameVar = useModProfileName();

const props = defineProps<{
  discussion?: Discussion;
}>();

const route = useRoute();

const discussionId = computed(() => {
  return typeof route.params.discussionId === 'string'
    ? route.params.discussionId
    : '';
});

const channelId = computed(() => {
  return typeof route.params.forumId === 'string' ? route.params.forumId : '';
});

const loggedInUserModName = computed(() => modProfileNameVar.value);

// If discussion is not provided via props, fetch it
const { result: getDiscussionResult } = useQuery(
  GET_DISCUSSION,
  () => ({
    id: discussionId.value,
    loggedInModName: loggedInUserModName.value,
    channelUniqueName: channelId.value,
  }),
  {
    enabled: !props.discussion,
  }
);

const discussion = computed<Discussion | null>(() => {
  return props.discussion || getDiscussionResult.value?.discussions?.[0] || null;
});

const downloadableFileId = computed(
  () => discussion.value?.DownloadableFiles?.[0]?.id || ''
);
const { attempts: pipelineAttempts } = useSharedDownloadPipelineOverview(
  downloadableFileId,
  discussionId,
  channelId,
  { pollWhileActive: false }
);
const significantPipelineAttempts = computed(() =>
  pipelineAttempts.value.filter((attempt) =>
    ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED'].includes(attempt.status)
  )
);
const formatPipelineTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
const pipelineAttemptUrl = (pipelineId: string) =>
  `/forums/${encodeURIComponent(channelId.value)}/downloads/${encodeURIComponent(
    discussionId.value
  )}/pipelines?attempt=${encodeURIComponent(
    pipelineId
  )}#attempt-${encodeURIComponent(pipelineId)}`;

// Get the active discussion channel for this forum
const activeDiscussionChannel = computed(() => {
  return discussion.value?.DiscussionChannels?.find(
    (dc) => dc.channelUniqueName === channelId.value
  );
});

// Get label change history from the discussion channel
const labelChangeHistory = computed(() => {
  return activeDiscussionChannel.value?.LabelChangeHistory || [];
});

// Check if there's any activity to show
const hasTitleEdits = computed(() => {
  return (
    discussion.value?.PastTitleVersions &&
    discussion.value.PastTitleVersions.length > 0
  );
});

const hasLabelChanges = computed(() => {
  return labelChangeHistory.value.length > 0;
});

const hasAnyActivity = computed(() => {
  return (
    hasTitleEdits.value ||
    hasLabelChanges.value ||
    significantPipelineAttempts.value.length > 0
  );
});
</script>

<template>
  <div class="px-2 py-4">
    <div v-if="!hasAnyActivity" class="text-center text-gray-500 dark:text-gray-400">
      No activity to display yet.
    </div>
    <div v-else class="space-y-4">
      <!-- Title Edit History -->
      <DiscussionTitleVersions
        v-if="discussion && hasTitleEdits"
        :discussion="discussion"
      />

      <!-- Label Change History -->
      <LabelChangeHistory
        v-if="hasLabelChanges"
        :label-change-history="labelChangeHistory"
      />

      <section
        v-if="significantPipelineAttempts.length"
        aria-labelledby="pipeline-activity-heading"
        class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
      >
        <h2 id="pipeline-activity-heading" class="font-semibold dark:text-white">
          Pipeline activity
        </h2>
        <ol class="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
          <li
            v-for="attempt in significantPipelineAttempts"
            :key="attempt.pipelineId"
            class="py-3 text-sm"
          >
            <NuxtLink
              :to="pipelineAttemptUrl(attempt.pipelineId)"
              class="font-medium text-orange-700 underline dark:text-orange-300"
            >
              {{ attempt.scope === 'SERVER' ? 'Server' : 'Channel' }} checks
              {{ attempt.status === 'SUCCEEDED' ? 'passed' : attempt.status.toLowerCase().replace('_', ' ') }}
            </NuxtLink>
            <span class="ml-2 text-gray-500 dark:text-gray-400">
              {{ formatPipelineTime(attempt.finishedAt || attempt.updatedAt) }}
            </span>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
