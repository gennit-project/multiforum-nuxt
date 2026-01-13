<script setup lang="ts">
import type { PropType } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import PrimaryButton from '@/components/PrimaryButton.vue';
import DownloadSuccessPopover from '@/components/download/DownloadSuccessPopover.vue';
import PluginPipeline from '@/components/plugins/PluginPipeline.vue';
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_DOWNLOAD_LABELS } from '@/graphQLData/discussion/queries';

const props = defineProps({
  discussion: {
    type: Object as PropType<Discussion>,
    required: false,
    default: null,
  },
  discussionId: {
    type: String,
    required: true,
  },
  channelUniqueName: {
    type: String,
    required: true,
  },
});

// Popover state
const showSuccessPopover = ref(false);

// Get the primary downloadable file (first one)
const primaryFile = computed(() => {
  return props.discussion?.DownloadableFiles?.[0] || null;
});

// Format price display
const priceDisplay = computed(() => {
  if (!primaryFile.value) return { main: '$0', sub: '00', label: null };

  if (primaryFile.value.priceModel === 'FREE') {
    return { main: '$0', sub: '00', label: null };
  }

  const cents = primaryFile.value.priceCents || 0;
  const dollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;

  return {
    main: `$${dollars}`,
    sub: remainingCents.toString().padStart(2, '0'),
    label: 'Purchase',
  };
});

// Get license info
const licenseInfo = computed(() => {
  return primaryFile.value?.license?.name || 'No license specified';
});

// Format file size with appropriate units
const formatFileSize = (sizeInBytes: number | null | undefined): string => {
  if (!sizeInBytes || sizeInBytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Show decimals for values >= 1, no decimals for bytes
  const decimals = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(decimals)} ${units[unitIndex]}`;
};

// Query for label options
const { result: labelQueryResult } = useQuery(
  GET_DOWNLOAD_LABELS,
  {
    discussionId: props.discussionId,
    channelUniqueName: props.channelUniqueName,
  },
  {
    enabled: !!props.discussionId && !!props.channelUniqueName,
  }
);

// Get label options from query result
const labelOptions = computed(() => {
  const discussionChannels =
    labelQueryResult.value?.discussions?.[0]?.DiscussionChannels;
  const discussionChannel = discussionChannels?.[0];
  return discussionChannel?.LabelOptions || [];
});

// Group labels by their group key for display
const groupedLabels = computed(() => {
  const groups: Record<
    string,
    Array<{ key: string; value: string; displayName: string }>
  > = {};

  labelOptions.value.forEach((option: any) => {
    const groupKey = option.group?.key;
    const groupDisplayName = option.group?.displayName;

    if (groupKey && groupDisplayName) {
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({
        key: groupDisplayName,
        value: option.value || '',
        displayName: option.displayName || option.value || '',
      });
    }
  });

  return groups;
});

const handleDownload = () => {
  if (!primaryFile.value?.url) {
    console.error('No download URL available');
    return;
  }

  // Only execute on client side
  if (import.meta.client) {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = primaryFile.value.url;
    link.download = primaryFile.value.fileName || 'download';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Show success popover after a short delay to ensure download started
  setTimeout(() => {
    showSuccessPopover.value = true;
  }, 500);
};
</script>

<template>
  <div
    class="flex w-full flex-col space-y-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:w-80"
  >
    <div class="p-6">
      <!-- Boxed Info Section -->
      <div
        v-if="primaryFile"
        class="bg-gray-50 mb-4 rounded-lg border border-orange-400 p-4 dark:border-orange-500 dark:bg-gray-700"
      >
        <!-- File Name -->
        <h3
          class="mb-3 break-words text-sm font-medium text-gray-900 dark:text-white"
        >
          {{ primaryFile.fileName || 'Untitled File' }}
        </h3>
        <!-- File Type and Size -->
        <div class="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {{ primaryFile.kind || 'OTHER' }} •
          {{ formatFileSize(primaryFile.size) }}
        </div>

        <!-- Price Section -->
        <!-- <div class="text-left mb-3">
          <div class="text-3xl font-bold text-gray-900 dark:text-white">
            <sup class="text-lg">{{ priceDisplay.main?.charAt(0) || '$' }}</sup>{{ priceDisplay.main?.slice(1) || '0' }}<sup class="text-lg">.{{ priceDisplay.sub || '00' }}</sup>
          </div>
          <div v-if="priceDisplay.label" class="py-1 text-sm text-gray-500 dark:text-gray-400">
            {{ priceDisplay.label }}
          </div>
        </div> -->

        <!-- Available Instantly -->
        <div class="text-sm font-medium text-green-600 dark:text-green-400">
          Available Instantly
        </div>
      </div>

      <!-- Download Button -->
      <PrimaryButton
        class="w-full justify-center"
        :label="'Download Now'"
        :disabled="!primaryFile"
        @click="handleDownload"
      />
      <div
        v-if="priceDisplay.label === 'Free Download'"
        class="mt-2 text-xs text-gray-500 dark:text-gray-400"
      >
        By downloading, you agree to the content license
      </div>
      <!-- <div v-else class="text-xs mt-2 text-gray-500 dark:text-gray-400">
        By placing an order, you're purchasing a content license
      </div> -->

      <!-- License Section -->
      <div class="border-t border-gray-200 pt-4 dark:border-gray-700">
        <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          License
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ licenseInfo }}
        </p>
      </div>

      <!-- Labels Section -->
      <div
        v-if="Object.keys(groupedLabels).length > 0"
        class="border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Labels
        </h3>
        <div class="space-y-2">
          <div
            v-for="(labels, groupKey) in groupedLabels"
            :key="groupKey"
            class="flex flex-wrap gap-2"
          >
            <div
              v-for="label in labels"
              :key="`${groupKey}-${label.value}`"
              class="inline-flex items-center gap-2 text-sm"
            >
              <span class="font-medium text-gray-700 dark:text-gray-300">
                {{ label.key }}:
              </span>
              <span
                class="rounded-full bg-gray-100 px-2 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {{ label.displayName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No File Available -->
      <div
        v-if="!primaryFile"
        class="text-center text-gray-500 dark:text-gray-400"
      >
        No downloadable files available
      </div>

      <!-- Plugin Pipeline Section -->
      <div
        v-if="primaryFile?.id"
        class="border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <PluginPipeline
          :target-id="primaryFile.id"
          target-type="DownloadableFile"
          title="Scan Status"
          :collapsible="true"
        />
      </div>
    </div>
  </div>

  <!-- Download Success Popover -->
  <DownloadSuccessPopover
    v-if="discussion"
    :discussion="discussion"
    :visible="showSuccessPopover"
    @close="showSuccessPopover = false"
  />
</template>
