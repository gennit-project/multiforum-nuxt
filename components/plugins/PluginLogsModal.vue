<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import type { PipelineRun } from '@/composables/usePluginPipeline';
import { usePluginPipeline } from '@/composables/usePluginPipeline';

const props = defineProps<{
  run: PipelineRun;
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { getStatusInfo, formatDuration } = usePluginPipeline(
  { value: null } as any,
  { value: '' } as any,
  { enabled: false }
);

const statusInfo = computed(() => getStatusInfo(props.run.status));

// Format the payload for display
const formattedPayload = computed(() => {
  if (!props.run.payload) return null;
  try {
    return JSON.stringify(props.run.payload, null, 2);
  } catch {
    return String(props.run.payload);
  }
});

// Copy payload to clipboard
const copied = ref(false);
const copyToClipboard = async () => {
  if (!formattedPayload.value) return;

  try {
    await navigator.clipboard.writeText(formattedPayload.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Format timestamp
const formatTimestamp = (isoString: string) => {
  return new Date(isoString).toLocaleString();
};
</script>

<template>
  <client-only>
    <TransitionRoot as="template" :show="visible">
      <Dialog
        as="div"
        class="relative"
        style="z-index: 1000"
        @close="emit('close')"
      >
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div
            class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
          >
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all dark:bg-gray-800 sm:my-8 sm:w-full sm:max-w-2xl"
              >
                <!-- Header -->
                <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <div
                        class="flex h-10 w-10 items-center justify-center rounded-full"
                        :class="statusInfo.bgColor"
                      >
                        <i :class="[statusInfo.icon, statusInfo.color]" />
                      </div>
                      <div>
                        <DialogTitle
                          as="h3"
                          class="text-lg font-medium text-gray-900 dark:text-white"
                        >
                          {{ run.pluginName || run.pluginId }}
                        </DialogTitle>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          v{{ run.version }} - {{ statusInfo.label }}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      @click="emit('close')"
                    >
                      <i class="fa-solid fa-times text-lg" />
                    </button>
                  </div>
                </div>

                <!-- Content -->
                <div class="max-h-96 overflow-y-auto px-6 py-4">
                  <!-- Execution Info -->
                  <div class="mb-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Started:</span>
                      <span class="ml-2 text-gray-900 dark:text-white">
                        {{ formatTimestamp(run.createdAt) }}
                      </span>
                    </div>
                    <div v-if="run.durationMs">
                      <span class="text-gray-500 dark:text-gray-400">Duration:</span>
                      <span class="ml-2 text-gray-900 dark:text-white">
                        {{ formatDuration(run.durationMs) }}
                      </span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Order:</span>
                      <span class="ml-2 text-gray-900 dark:text-white">
                        #{{ run.executionOrder + 1 }}
                      </span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Pipeline ID:</span>
                      <span class="ml-2 font-mono text-xs text-gray-900 dark:text-white">
                        {{ run.pipelineId }}
                      </span>
                    </div>
                  </div>

                  <!-- Message -->
                  <div v-if="run.message" class="mb-4">
                    <h4 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Message
                    </h4>
                    <div
                      class="rounded-md p-3 text-sm"
                      :class="run.status === 'FAILED' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
                    >
                      {{ run.message }}
                    </div>
                  </div>

                  <!-- Skipped Reason -->
                  <div v-if="run.skippedReason" class="mb-4">
                    <h4 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Skipped Reason
                    </h4>
                    <div class="rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {{ run.skippedReason }}
                    </div>
                  </div>

                  <!-- Payload / Logs -->
                  <div v-if="formattedPayload">
                    <div class="mb-2 flex items-center justify-between">
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                        Output / Logs
                      </h4>
                      <button
                        type="button"
                        class="flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                        @click="copyToClipboard"
                      >
                        <i :class="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'" />
                        <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
                      </button>
                    </div>
                    <pre class="max-h-48 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100"><code>{{ formattedPayload }}</code></pre>
                  </div>

                  <!-- No additional info -->
                  <div
                    v-if="!run.message && !run.skippedReason && !formattedPayload"
                    class="text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No additional details available for this plugin run.
                  </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                  <button
                    type="button"
                    class="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    @click="emit('close')"
                  >
                    Close
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </client-only>
</template>
