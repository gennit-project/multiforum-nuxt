<script setup lang="ts">
import { ref, toRef, computed, useId } from 'vue';
import {
  usePluginPipeline,
  type PipelineRun,
} from '@/composables/usePluginPipeline';
import PipelineJobPage from './PipelineJobPage.vue';
import PluginPipelineStage from './PluginPipelineStage.vue';
import PluginLogsModal from './PluginLogsModal.vue';

const props = defineProps<{
  fileId?: string | null;
  discussionId?: string | null;
  channelName?: string;
  collapsible?: boolean;
}>();

const isExpanded = ref(true);
const selectedRun = ref<PipelineRun | null>(null);
const showLogsModal = ref(false);
const pipelineContentId = useId();

// Query server pipelines (file-level)
const {
  latestPipeline: serverPipeline,
  pipelineGroups: serverGroups,
  hasMore: serverHasMore,
  moreLoading: serverMoreLoading,
  moreError: serverMoreError,
  loadMore: loadMoreServer,
  updateAttempt: updateServerAttempt,
  refetch: refetchServer,
  hasActivePipeline: hasActiveServerPipeline,
  loading: serverLoading,
  error: serverError,
  isPolling: serverPolling,
  getStatusInfo,
} = usePluginPipeline(toRef(props, 'fileId'), ref('DownloadableFile'), {
  enabled: computed(() => !!props.fileId),
});

// Query channel pipelines (discussion-level)
const {
  latestPipeline: channelPipeline,
  pipelineGroups: channelGroups,
  hasMore: channelHasMore,
  moreLoading: channelMoreLoading,
  moreError: channelMoreError,
  loadMore: loadMoreChannel,
  updateAttempt: updateChannelAttempt,
  refetch: refetchChannel,
  hasActivePipeline: hasActiveChannelPipeline,
  loading: channelLoading,
  error: channelError,
  isPolling: channelPolling,
} = usePluginPipeline(toRef(props, 'discussionId'), ref('Discussion'), {
  enabled: computed(() => !!props.discussionId),
  channelId: toRef(props, 'channelName'),
});

// Combined state
const isLoading = computed(() => serverLoading.value || channelLoading.value);
const hasAnyPipeline = computed(
  () => serverPipeline.value || channelPipeline.value
);
const hasActivePipeline = computed(
  () => hasActiveServerPipeline.value || hasActiveChannelPipeline.value
);
const isPolling = computed(() => serverPolling.value || channelPolling.value);

// Get overall status for header display
const overallStatus = computed(() => {
  if (hasActivePipeline.value) return 'RUNNING';

  const serverStatus = serverPipeline.value?.status;
  const channelStatus = channelPipeline.value?.status;

  // If either failed, show failed
  if (serverStatus === 'FAILED' || channelStatus === 'FAILED') return 'FAILED';

  // If both succeeded (or only one exists and succeeded), show succeeded
  if (
    (serverStatus === 'SUCCEEDED' || !serverPipeline.value) &&
    (channelStatus === 'SUCCEEDED' || !channelPipeline.value)
  ) {
    return 'SUCCEEDED';
  }

  return serverStatus || channelStatus || 'PENDING';
});

const handleViewLogs = (run: PipelineRun) => {
  selectedRun.value = run;
  showLogsModal.value = true;
};

const handleCloseModal = () => {
  showLogsModal.value = false;
  selectedRun.value = null;
};
</script>

<template>
  <div
    v-if="
      hasAnyPipeline ||
      isLoading ||
      serverError ||
      channelError ||
      hasActivePipeline
    "
    class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Header -->
    <component
      :is="collapsible ? 'button' : 'div'"
      :type="collapsible ? 'button' : undefined"
      :aria-expanded="collapsible ? isExpanded : undefined"
      :aria-controls="collapsible ? pipelineContentId : undefined"
      class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700"
      :class="{ 'w-full cursor-pointer text-left': collapsible }"
      @click="collapsible && (isExpanded = !isExpanded)"
    >
      <div class="flex items-center space-x-2">
        <i class="fa-solid fa-plug text-gray-400" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Plugin Pipelines
        </h3>
        <span
          v-if="hasActivePipeline"
          class="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400"
        >
          <i class="fa-solid fa-spinner fa-spin" />
          <span>Running</span>
        </span>
        <span
          v-else-if="hasAnyPipeline"
          class="flex items-center space-x-1 text-xs"
          :class="getStatusInfo(overallStatus).color"
        >
          <i :class="getStatusInfo(overallStatus).icon" />
          <span>{{ getStatusInfo(overallStatus).label }}</span>
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <span
          v-if="isPolling"
          class="text-xs text-gray-400"
          title="Auto-refreshing"
        >
          <i class="fa-solid fa-sync fa-spin" />
        </span>
        <span
          v-if="collapsible"
          aria-hidden="true"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <i
            :class="
              isExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'
            "
            aria-hidden="true"
          />
        </span>
      </div>
    </component>

    <div :id="pipelineContentId">
      <!-- Loading State -->
      <div v-if="isLoading && !hasAnyPipeline" class="p-4 text-center">
        <i class="fa-solid fa-spinner fa-spin mr-2 text-gray-400" />
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Loading pipeline status...
        </span>
      </div>

      <!-- Error State -->
      <div
        v-else-if="serverError || channelError"
        role="alert"
        class="p-4 text-center"
      >
        <i class="fa-solid fa-exclamation-triangle mr-2 text-red-400" />
        <span class="text-sm text-red-600 dark:text-red-400">
          {{ serverError?.message || channelError?.message }}
        </span>
        <button
          type="button"
          class="min-h-11 px-3 underline"
          @click="
            refetchServer();
            refetchChannel();
          "
        >
          Retry
        </button>
      </div>

      <!-- Pipeline Content -->
      <div v-else-if="hasAnyPipeline && isExpanded" class="space-y-4 p-4">
        <!-- Server Pipeline Section -->
        <div v-for="serverGroup in serverGroups" :key="serverGroup.pipelineId">
          <div class="mb-2 flex items-center space-x-2">
            <i class="fa-solid fa-server text-xs text-gray-400" />
            <h4
              class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
            >
              Server Pipeline
            </h4>
            <span
              class="flex items-center space-x-1 text-xs"
              :class="getStatusInfo(serverGroup.status).color"
            >
              <i :class="getStatusInfo(serverGroup.status).icon" />
            </span>
          </div>
          <div
            class="space-y-0 border-l-2 border-gray-200 pl-4 dark:border-gray-700"
          >
            <PluginPipelineStage
              v-for="(run, index) in serverGroup.runs"
              :key="run.id"
              :run="run"
              :is-last="index === serverGroup.runs.length - 1"
              @view-logs="handleViewLogs"
            />
          </div>
          <PipelineJobPage
            v-if="serverGroup.page"
            :attempt="serverGroup.page"
            @update="updateServerAttempt"
          />
        </div>
        <p v-if="serverMoreError" role="alert">
          Earlier server attempts could not be loaded.
        </p>
        <button
          v-if="serverHasMore"
          type="button"
          class="min-h-11 px-3 text-sm underline"
          :disabled="serverMoreLoading"
          @click="loadMoreServer"
        >
          Load more server attempts
        </button>

        <!-- Channel Pipeline Section -->
        <div
          v-for="channelGroup in channelGroups"
          :key="channelGroup.pipelineId"
        >
          <div class="mb-2 flex items-center space-x-2">
            <i class="fa-solid fa-hashtag text-xs text-gray-400" />
            <h4
              class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
            >
              Channel Pipeline
              <span v-if="channelName" class="normal-case">
                ({{ channelName }})
              </span>
            </h4>
            <span
              class="flex items-center space-x-1 text-xs"
              :class="getStatusInfo(channelGroup.status).color"
            >
              <i :class="getStatusInfo(channelGroup.status).icon" />
            </span>
          </div>
          <div
            class="space-y-0 border-l-2 border-gray-200 pl-4 dark:border-gray-700"
          >
            <PluginPipelineStage
              v-for="(run, index) in channelGroup.runs"
              :key="run.id"
              :run="run"
              :is-last="index === channelGroup.runs.length - 1"
              @view-logs="handleViewLogs"
            />
          </div>
          <PipelineJobPage
            v-if="channelGroup.page"
            :attempt="channelGroup.page"
            @update="updateChannelAttempt"
          />
        </div>
        <p v-if="channelMoreError" role="alert">
          Earlier channel attempts could not be loaded.
        </p>
        <button
          v-if="channelHasMore"
          type="button"
          class="min-h-11 px-3 text-sm underline"
          :disabled="channelMoreLoading"
          @click="loadMoreChannel"
        >
          Load more channel attempts
        </button>

        <!-- No plugins ran -->
        <div
          v-if="!serverPipeline?.runs?.length && !channelPipeline?.runs?.length"
          class="text-center text-sm text-gray-500 dark:text-gray-400"
        >
          No plugins ran for this content.
        </div>
      </div>

      <!-- No pipeline data -->
      <div
        v-else-if="!hasAnyPipeline && !isLoading"
        class="p-4 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        {{
          hasActivePipeline
            ? 'Work is still running. Refreshing status…'
            : 'No plugin activity for this content.'
        }}
      </div>
    </div>
  </div>

  <!-- Logs Modal -->
  <PluginLogsModal
    v-if="selectedRun"
    :run="selectedRun"
    :visible="showLogsModal"
    @close="handleCloseModal"
  />
</template>
