<script setup lang="ts">
import type { PropType } from 'vue';
import type { Discussion, FilterOption } from '@/__generated__/graphql';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import DownloadNowButton from '@/components/channel/DownloadNowButton.vue';
import FunctionalDownloadNow from '@/components/channel/FunctionalDownloadNow.vue';
import DownloadSuccessPopover from '@/components/download/DownloadSuccessPopover.vue';
import ScopedPipelineView from '@/components/plugins/ScopedPipelineView.vue';
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { GET_DOWNLOAD_LABELS } from '@/graphQLData/discussion/queries';
import { useUsername } from '@/composables/useAuthState';

type DownloadScanStatus =
  | 'PENDING'
  | 'CLEAN'
  | 'INFECTED'
  | 'SUSPICIOUS'
  | 'FAILED';

type ScannedDownloadableFile = Omit<
  Discussion['DownloadableFiles'][number],
  'scanStatus' | 'scanCheckedAt'
> & {
  scanStatus?: DownloadScanStatus | null;
  scanReason?: string | null;
  scanCheckedAt?: string | null;
  uploadedByUsername?: string | null;
};

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

const username = useUsername();

// Popover state
const showSuccessPopover = ref(false);

// Get the primary downloadable file (first one)
const primaryFile = computed(() => {
  return (props.discussion?.DownloadableFiles?.[0] as
    | ScannedDownloadableFile
    | undefined) || null;
});

const hasDownloadableFile = computed(() => {
  return (props.discussion?.DownloadableFiles?.length || 0) > 0;
});

const scanStatus = computed<DownloadScanStatus>(
  () => primaryFile.value?.scanStatus || 'PENDING'
);

const creatorIsViewing = computed(
  () => Boolean(username.value) && props.discussion?.Author?.username === username.value
);

const hasReviewAccess = computed(
  () => scanStatus.value !== 'CLEAN' && Boolean(primaryFile.value?.url)
);

const downloadDisabled = computed(
  () =>
    !hasDownloadableFile.value ||
    (scanStatus.value !== 'CLEAN' && !hasReviewAccess.value)
);

const downloadLabel = computed(() =>
  hasReviewAccess.value ? 'Download for review' : 'Download Now'
);

const replaceFilePath = computed(
  () => `/forums/${props.channelUniqueName}/downloads/edit/${props.discussionId}`
);

const requestReviewPath = computed(
  () => `/forums/${props.channelUniqueName}/issues/create`
);

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

const downloadCounts = computed(() => {
  return {
    total: primaryFile.value?.downloadCountTotal || 0,
    unique: primaryFile.value?.downloadCountUnique || 0,
  };
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

  labelOptions.value.forEach((option: FilterOption) => {
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
        <h2
          class="mb-3 break-words text-sm font-medium text-gray-900 dark:text-white"
        >
          {{ primaryFile.fileName || 'Untitled File' }}
        </h2>
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

        <div
          aria-live="polite"
          class="rounded-md p-3 text-sm"
          :class="{
            'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200': scanStatus === 'CLEAN',
            'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200': scanStatus === 'PENDING' || scanStatus === 'SUSPICIOUS',
            'bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-200': scanStatus === 'INFECTED',
            'bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200': scanStatus === 'FAILED',
          }"
          data-testid="download-scan-status"
        >
          <p v-if="scanStatus === 'CLEAN'" class="font-medium">
            <i class="fa-solid fa-circle-check mr-1" />
            Available to download
          </p>
          <p v-else-if="scanStatus === 'PENDING'" class="font-medium">
            <i class="fa-solid fa-spinner mr-1 animate-spin" />
            {{ creatorIsViewing ? 'Scanning your upload…' : 'Security scan in progress' }}
          </p>
          <template v-else-if="scanStatus === 'INFECTED' || scanStatus === 'SUSPICIOUS'">
            <p class="font-medium">
              <i class="fa-solid fa-shield-halved mr-1" />
              Held for security review
            </p>
            <p class="mt-1">
              <template v-if="creatorIsViewing">
                This upload was blocked by the security scan<span v-if="primaryFile.scanReason">: {{ primaryFile.scanReason }}</span>.
              </template>
              <template v-else>
                This download is not publicly available while its content is reviewed.
              </template>
            </p>
            <div v-if="creatorIsViewing" class="mt-2 flex flex-wrap gap-3">
              <NuxtLink class="font-medium underline" :to="replaceFilePath">
                Replace file
              </NuxtLink>
              <NuxtLink class="font-medium underline" :to="requestReviewPath">
                Request human review
              </NuxtLink>
            </div>
          </template>
          <template v-else>
            <p class="font-medium">
              <i class="fa-solid fa-triangle-exclamation mr-1" />
              Security scan unavailable
            </p>
            <p class="mt-1">
              <template v-if="creatorIsViewing">
                We couldn't complete the security scan—a problem on our end, not your file. Try again shortly, or open an issue.
              </template>
              <template v-else>
                This download is temporarily unavailable because its security scan could not complete.
              </template>
            </p>
            <NuxtLink
              v-if="creatorIsViewing"
              class="mt-2 inline-block font-medium underline"
              to="/server/issues/create"
            >
              Open an issue
            </NuxtLink>
          </template>
        </div>
        <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Total downloads</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{ downloadCounts.total }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Unique downloaders</dt>
            <dd class="font-medium text-gray-900 dark:text-white">
              {{ downloadCounts.unique }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- No File Available -->
      <div
        v-if="!primaryFile"
        class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
      >
        No downloadable files available
      </div>

      <!-- Download Button -->
      <RequireAuth :full-width="true">
        <template #has-auth>
          <FunctionalDownloadNow
            :disabled="downloadDisabled"
            :url="primaryFile?.url || ''"
            :file-name="primaryFile?.fileName || 'download'"
            :downloadable-file-id="primaryFile?.id || ''"
            :discussion-id="discussionId"
            :label="downloadLabel"
            @downloaded="showSuccessPopover = true"
          />
        </template>
        <template #does-not-have-auth>
          <DownloadNowButton
            :disabled="downloadDisabled"
            :label="downloadLabel"
          />
        </template>
      </RequireAuth>
      <div
        v-if="primaryFile && priceDisplay.label === 'Free Download'"
        class="mt-2 text-xs text-gray-500 dark:text-gray-400"
      >
        By downloading, you agree to the content license
      </div>
      <!-- <div v-else class="text-xs mt-2 text-gray-500 dark:text-gray-400">
        By placing an order, you're purchasing a content license
      </div> -->

      <!-- License Section -->
      <div
        v-if="primaryFile"
        class="border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <h2 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          License
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ licenseInfo }}
        </p>
      </div>

      <!-- Labels Section -->
      <div
        v-if="Object.keys(groupedLabels).length > 0"
        class="border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <h2 class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Labels
        </h2>
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

      <!-- Plugin Pipeline Section -->
      <div
        v-if="primaryFile?.id || discussionId"
        class="border-t border-gray-200 pt-4 dark:border-gray-700"
      >
        <ScopedPipelineView
          :file-id="primaryFile?.id"
          :discussion-id="discussionId"
          :channel-name="channelUniqueName"
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
