<script setup lang="ts">
import { computed } from 'vue';
import type { PipelineRun } from '@/composables/usePluginPipeline';
import { usePluginPipeline } from '@/composables/usePluginPipeline';

const props = defineProps<{
  run: PipelineRun;
  isLast?: boolean;
}>();

const emit = defineEmits<{
  viewLogs: [run: PipelineRun];
}>();

const { formatDuration, getStatusInfo } = usePluginPipeline(
  { value: null } as any,
  { value: '' } as any,
  { enabled: false }
);

const statusInfo = computed(() => getStatusInfo(props.run.status));

const durationDisplay = computed(() => {
  if (props.run.status === 'PENDING' || props.run.status === 'RUNNING') {
    return '';
  }
  return formatDuration(props.run.durationMs);
});

const hasDetails = computed(() => {
  return props.run.message || props.run.skippedReason || props.run.payload;
});
</script>

<template>
  <div class="relative flex items-start">
    <!-- Connector line -->
    <div
      v-if="!isLast"
      class="absolute left-3 top-6 h-full w-0.5 bg-gray-200 dark:bg-gray-600"
    />

    <!-- Status icon -->
    <div
      class="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
      :class="statusInfo.bgColor"
    >
      <i
        :class="[statusInfo.icon, statusInfo.color, 'text-xs']"
      />
    </div>

    <!-- Content -->
    <div class="ml-3 flex-1 pb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ run.pluginName || run.pluginId }}
          </span>
          <span
            v-if="run.version"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            v{{ run.version }}
          </span>
        </div>
        <div class="flex items-center space-x-2">
          <span
            v-if="durationDisplay"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ durationDisplay }}
          </span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="statusInfo.bgColor"
          >
            <span :class="statusInfo.color">{{ statusInfo.label }}</span>
          </span>
        </div>
      </div>

      <!-- Message or skipped reason -->
      <p
        v-if="run.message"
        class="mt-1 text-xs"
        :class="run.status === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'"
      >
        {{ run.message }}
      </p>
      <p
        v-if="run.skippedReason"
        class="mt-1 text-xs text-gray-500 dark:text-gray-400"
      >
        Skipped: {{ run.skippedReason }}
      </p>

      <!-- View logs button -->
      <button
        v-if="hasDetails && run.status !== 'PENDING' && run.status !== 'RUNNING'"
        type="button"
        class="mt-1 text-xs text-orange-600 hover:underline dark:text-orange-400"
        @click="emit('viewLogs', run)"
      >
        View Details
      </button>
    </div>
  </div>
</template>
