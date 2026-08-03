<script setup lang="ts">
import type { PropType } from 'vue';
import type { Discussion } from '@/__generated__/graphql';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import DownloadNowButton from '@/components/channel/DownloadNowButton.vue';
import FunctionalDownloadNow from '@/components/channel/FunctionalDownloadNow.vue';
import DownloadSuccessPopover from '@/components/download/DownloadSuccessPopover.vue';
import DownloadPipelineStatusSummary from '@/components/plugins/DownloadPipelineStatusSummary.vue';
import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  REQUEST_DOWNLOADABLE_FILE_REVIEW,
  RETRY_DOWNLOADABLE_FILE_SCAN,
} from '@/graphQLData/discussion/mutations';
import { useUsername } from '@/composables/useAuthState';

type DownloadScanStatus =
  'PENDING' | 'CLEAN' | 'INFECTED' | 'SUSPICIOUS' | 'FAILED';

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
const retryingScan = ref(false);
const retryError = ref('');
const { mutate: retryDownloadableFileScan } = useMutation(
  RETRY_DOWNLOADABLE_FILE_SCAN
);
const reviewRequestedLocally = ref(false);
const {
  mutate: requestDownloadableFileReview,
  loading: requestingReview,
  error: requestReviewError,
  onDone: onReviewRequested,
} = useMutation(REQUEST_DOWNLOADABLE_FILE_REVIEW);
onReviewRequested(() => {
  reviewRequestedLocally.value = true;
});

// Popover state
const showSuccessPopover = ref(false);

// Get the primary downloadable file (first one)
const primaryFile = computed(() => {
  return (
    (props.discussion?.DownloadableFiles?.[0] as
      ScannedDownloadableFile | undefined) || null
  );
});

const hasDownloadableFile = computed(() => {
  return (props.discussion?.DownloadableFiles?.length || 0) > 0;
});

const scanStatus = computed<DownloadScanStatus>(() =>
  retryingScan.value ? 'PENDING' : primaryFile.value?.scanStatus || 'PENDING'
);

const retryScan = async () => {
  if (!primaryFile.value?.id || retryingScan.value) return;
  retryError.value = '';
  retryingScan.value = true;
  try {
    await retryDownloadableFileScan({
      downloadableFileId: primaryFile.value.id,
    });
  } catch {
    retryingScan.value = false;
    retryError.value = 'The retry could not be started.';
  }
};

const creatorIsViewing = computed(
  () =>
    Boolean(username.value) &&
    props.discussion?.Author?.username === username.value
);

const reviewRequested = computed(() => reviewRequestedLocally.value);

const requestHumanReview = () => {
  if (
    !primaryFile.value?.id ||
    requestingReview.value ||
    reviewRequested.value
  ) {
    return;
  }
  requestDownloadableFileReview({
    downloadableFileId: primaryFile.value.id,
    reason: null,
  });
};

const hasReviewAccess = computed(
  () => scanStatus.value !== 'CLEAN' && Boolean(primaryFile.value?.url)
);

const downloadDisabled = computed(
  () => !hasDownloadableFile.value || scanStatus.value !== 'CLEAN'
);

const downloadLabel = 'Download Now';

const replaceFilePath = computed(
  () =>
    `/forums/${props.channelUniqueName}/downloads/edit/${props.discussionId}`
);

const pipelinePath = computed(
  () =>
    `/forums/${props.channelUniqueName}/downloads/${props.discussionId}/pipelines`
);

const scanCheckedDisplay = computed(() => {
  if (!primaryFile.value?.scanCheckedAt) return '';
  const checkedAt = new Date(primaryFile.value.scanCheckedAt);
  return Number.isNaN(checkedAt.getTime()) ? '' : checkedAt.toLocaleString();
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
</script>

<template>
  <div
    class="flex w-full flex-col space-y-4 rounded-lg border border-gray-200 bg-white lg:w-80 dark:border-gray-700 dark:bg-gray-800"
  >
    <div class="p-6">
      <!-- Boxed Info Section -->
      <div
        v-if="primaryFile"
        class="bg-gray-50 mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-600 dark:bg-gray-700"
      >
        <!-- File Name -->
        <h2
          class="mb-3 text-sm font-medium wrap-break-word text-gray-900 dark:text-white"
        >
          {{ primaryFile.fileName || 'Untitled File' }}
        </h2>
        <!-- File Type and Size -->
        <div class="mb-3 text-sm text-gray-600 dark:text-gray-300">
          {{ primaryFile.kind || 'OTHER' }} •
          {{ formatFileSize(primaryFile.size) }}
        </div>

        <div
          aria-live="polite"
          class="rounded-md p-3 text-sm"
          :class="{
            'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200':
              scanStatus === 'CLEAN',
            'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200':
              scanStatus === 'PENDING' || scanStatus === 'SUSPICIOUS',
            'bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-200':
              scanStatus === 'INFECTED',
            'bg-sky-50 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200':
              scanStatus === 'FAILED',
          }"
          data-testid="download-scan-status"
        >
          <p v-if="scanStatus === 'CLEAN'" class="font-medium">
            <i class="fa-solid fa-circle-check mr-1" />
            Available to download
          </p>
          <p v-else-if="scanStatus === 'PENDING'" class="font-medium">
            <i class="fa-solid fa-hourglass-half mr-1" />
            Quarantined: security check pending
          </p>
          <template
            v-else-if="scanStatus === 'INFECTED' || scanStatus === 'SUSPICIOUS'"
          >
            <p class="font-medium">
              <i class="fa-solid fa-shield-halved mr-1" />
              {{
                scanStatus === 'INFECTED'
                  ? 'Quarantined: threat detected'
                  : 'Quarantined: suspicious content'
              }}
            </p>
            <p class="mt-1">
              <template v-if="creatorIsViewing">
                This upload was blocked by the security scan<span
                  v-if="primaryFile.scanReason"
                  >: {{ primaryFile.scanReason }}</span
                >.
              </template>
              <template v-else>
                This download is not publicly available while its content is
                reviewed.
              </template>
            </p>
            <div v-if="creatorIsViewing" class="mt-2 flex flex-wrap gap-3">
              <NuxtLink class="font-medium underline" :to="replaceFilePath">
                Replace file
              </NuxtLink>
              <button
                type="button"
                class="font-medium underline disabled:no-underline disabled:opacity-70"
                :disabled="requestingReview || reviewRequested"
                @click="requestHumanReview"
              >
                {{
                  reviewRequested
                    ? 'Human review requested'
                    : requestingReview
                      ? 'Requesting review…'
                      : 'Request human review'
                }}
              </button>
              <button
                type="button"
                class="font-medium underline disabled:no-underline disabled:opacity-70"
                :disabled="retryingScan"
                @click="retryScan"
              >
                {{ retryingScan ? 'Retrying…' : 'Retry scan' }}
              </button>
            </div>
            <p v-if="requestReviewError" class="mt-2 font-medium">
              The review request could not be sent. Please try again.
            </p>
          </template>
          <template v-else>
            <div class="flex items-start gap-2">
              <i
                class="fa-solid fa-circle-exclamation mt-0.5"
                aria-hidden="true"
              />
              <div class="min-w-0 flex-1">
                <p class="font-medium">Security check needs another try</p>
                <p class="mt-0.5 text-xs leading-5">
                  {{
                    creatorIsViewing
                      ? "The scan service had a problem—your file wasn't rejected."
                      : 'This download is temporarily unavailable.'
                  }}
                </p>
                <div class="mt-1.5 flex flex-wrap gap-3">
                  <button
                    v-if="creatorIsViewing"
                    type="button"
                    class="font-medium underline disabled:no-underline disabled:opacity-70"
                    :disabled="retryingScan"
                    @click="retryScan"
                  >
                    {{ retryingScan ? 'Retrying…' : 'Retry scan' }}
                  </button>
                  <NuxtLink class="font-medium underline" :to="pipelinePath">
                    View checks
                  </NuxtLink>
                </div>
              </div>
            </div>
            <p v-if="retryError" class="mt-2 font-medium">
              {{ retryError }}
              <NuxtLink class="ml-1 underline" to="/server/issues/create">
                Open an issue
              </NuxtLink>
            </p>
          </template>
          <p
            v-if="scanCheckedDisplay && scanStatus !== 'FAILED'"
            class="mt-2 text-xs opacity-80"
          >
            Last checked {{ scanCheckedDisplay }}
          </p>
          <NuxtLink
            v-if="scanStatus !== 'CLEAN' && scanStatus !== 'FAILED'"
            class="mt-2 inline-block font-medium underline"
            :to="pipelinePath"
          >
            View security pipeline
          </NuxtLink>
          <p
            v-if="
              hasReviewAccess &&
              scanStatus !== 'CLEAN' &&
              scanStatus !== 'FAILED'
            "
            class="mt-2 text-xs"
          >
            Direct download is disabled while this file is quarantined. Review
            the scanner findings before clearing it.
          </p>
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
        class="bg-gray-50 mb-4 rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300"
      >
        No downloadable files available
      </div>

      <!-- Download Button -->
      <RequireAuth :full-width="true">
        <template #has-auth>
          <FunctionalDownloadNow
            :disabled="downloadDisabled"
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
      <DownloadPipelineStatusSummary
        v-if="primaryFile?.id"
        :file-id="primaryFile.id"
        :discussion-id="discussionId"
        :channel-name="channelUniqueName"
      />
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
