<script lang="ts" setup>
// Two-column issue layout: the list (passed via the default slot) on the left
// and a detail pane for the selected issue on the right (wide screens only).
// The selected issue is held in the shared UI store so clicking a row in the
// list opens it in the pane. Shared by the admin issue pages and the public
// /server/issues transparency pages.
import IssueDetail from '@/components/mod/IssueDetail.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

defineProps<{
  showDetailPane: boolean;
}>();

const uiStore = useUIStore();
const { selectedIssueNumber, selectedIssueTitle, selectedIssueChannelId } =
  storeToRefs(uiStore);
</script>

<template>
  <div class="relative w-full">
    <div
      class="flex flex-col divide-x dark:divide-gray-500 md:flex-row"
      :class="showDetailPane ? 'lg:h-[calc(100vh-3.5rem)]' : ''"
    >
      <div
        :class="
          showDetailPane
            ? 'min-w-0 flex-1 lg:w-1/2 lg:overflow-y-auto'
            : 'w-full'
        "
        class="p-4 md:p-6"
      >
        <slot />
      </div>
      <div
        v-if="showDetailPane"
        class="hidden lg:flex lg:w-1/2 lg:overflow-y-auto"
      >
        <div
          v-if="selectedIssueNumber && selectedIssueChannelId"
          class="flex w-full flex-col rounded-lg border border-gray-200 p-4 dark:border-gray-700"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div class="flex-1">
              <h2
                v-if="selectedIssueTitle"
                class="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {{ selectedIssueTitle }}
              </h2>
            </div>
            <a
              :href="`/forums/${selectedIssueChannelId}/issues/${selectedIssueNumber}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
            >
              Open in new tab
            </a>
          </div>
          <IssueDetail
            :channel-id="selectedIssueChannelId"
            :issue-number="selectedIssueNumber"
          />
        </div>
        <div
          v-else
          class="w-full rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
        >
          Select an issue to view details.
        </div>
      </div>
    </div>
  </div>
</template>
