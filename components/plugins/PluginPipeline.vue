<script setup lang="ts">
import { ref, toRef } from 'vue';
import { usePluginPipeline, type PipelineRun } from '@/composables/usePluginPipeline';
import PluginPipelineStage from './PluginPipelineStage.vue';
import PluginLogsModal from './PluginLogsModal.vue';

const props = defineProps<{
  targetId: string;
  targetType: string;
  title?: string;
  collapsible?: boolean;
}>();

const isExpanded = ref(true);
const selectedRun = ref<PipelineRun | null>(null);
const showLogsModal = ref(false);

const {
  latestPipeline,
  hasActivePipeline,
  loading,
  error,
  isPolling,
  getStatusInfo,
} = usePluginPipeline(
  toRef(props, 'targetId'),
  toRef(props, 'targetType')
);

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
    v-if="latestPipeline || loading"
    class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700"
      :class="{ 'cursor-pointer': collapsible }"
      @click="collapsible && (isExpanded = !isExpanded)"
    >
      <div class="flex items-center space-x-2">
        <i class="fa-solid fa-plug text-gray-400" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ title || 'Plugin Pipeline' }}
        </h3>
        <span
          v-if="hasActivePipeline"
          class="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400"
        >
          <i class="fa-solid fa-spinner fa-spin" />
          <span>Running</span>
        </span>
        <span
          v-else-if="latestPipeline"
          class="flex items-center space-x-1 text-xs"
          :class="getStatusInfo(latestPipeline.status).color"
        >
          <i :class="getStatusInfo(latestPipeline.status).icon" />
          <span>{{ getStatusInfo(latestPipeline.status).label }}</span>
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
        <button
          v-if="collapsible"
          type="button"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <i
            :class="isExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"
          />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && !latestPipeline"
      class="p-4 text-center"
    >
      <i class="fa-solid fa-spinner fa-spin mr-2 text-gray-400" />
      <span class="text-sm text-gray-500 dark:text-gray-400">
        Loading pipeline status...
      </span>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="p-4 text-center"
    >
      <i class="fa-solid fa-exclamation-triangle mr-2 text-red-400" />
      <span class="text-sm text-red-600 dark:text-red-400">
        {{ error.message }}
      </span>
    </div>

    <!-- Pipeline Content -->
    <div
      v-else-if="latestPipeline && isExpanded"
      class="p-4"
    >
      <!-- Pipeline stages -->
      <div class="space-y-0">
        <PluginPipelineStage
          v-for="(run, index) in latestPipeline.runs"
          :key="run.id"
          :run="run"
          :is-last="index === latestPipeline.runs.length - 1"
          @view-logs="handleViewLogs"
        />
      </div>

      <!-- No plugins ran -->
      <div
        v-if="latestPipeline.runs.length === 0"
        class="text-center text-sm text-gray-500 dark:text-gray-400"
      >
        No plugins ran for this file.
      </div>
    </div>

    <!-- No pipeline data -->
    <div
      v-else-if="!latestPipeline && !loading"
      class="p-4 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      No plugin activity for this file.
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
