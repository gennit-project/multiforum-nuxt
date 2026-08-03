<script setup lang="ts">
import { ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { ShieldCheck } from 'lucide-vue-next';
import { GET_DOWNLOAD_SCAN_REVIEW_QUEUE } from '@/graphQLData/admin/queries';
import {
  CLEAR_DOWNLOADABLE_FILE_SCAN,
  RETRY_DOWNLOADABLE_FILE_SCAN,
} from '@/graphQLData/discussion/mutations';

type ReviewItem = {
  downloadableFileId: string;
  fileName: string;
  scanStatus: 'SUSPICIOUS' | 'INFECTED' | 'FAILED';
  scanReason?: string | null;
  reviewRequestedAt?: string | null;
  reviewRequestReason?: string | null;
  uploaderUsername?: string | null;
  discussionId: string;
  discussionTitle?: string | null;
  channelUniqueName?: string | null;
};

const reviewNotes = ref<Record<string, string>>({});
const clearingFileId = ref('');
const retryingFileId = ref('');

const {
  result,
  loading,
  error,
  refetch,
} = useQuery(GET_DOWNLOAD_SCAN_REVIEW_QUEUE, { limit: 50 }, {
  fetchPolicy: 'cache-and-network',
  prefetch: false,
});

const {
  mutate: clearDownloadableFileScan,
  loading: clearing,
  error: clearError,
} = useMutation(CLEAR_DOWNLOADABLE_FILE_SCAN);

const {
  mutate: retryDownloadableFileScan,
  loading: retrying,
  error: retryError,
} = useMutation(RETRY_DOWNLOADABLE_FILE_SCAN);

const clearReview = async (item: ReviewItem) => {
  const reason = reviewNotes.value[item.downloadableFileId]?.trim();
  if (clearing.value || !reason) return;
  clearingFileId.value = item.downloadableFileId;
  try {
    await clearDownloadableFileScan({
      downloadableFileId: item.downloadableFileId,
      reason,
    });
    await refetch();
  } catch {
    // Apollo exposes the mutation error through clearError below.
  } finally {
    clearingFileId.value = '';
  }
};

const retryScan = async (item: ReviewItem) => {
  if (retrying.value) return;
  retryingFileId.value = item.downloadableFileId;
  try {
    await retryDownloadableFileScan({
      downloadableFileId: item.downloadableFileId,
    });
    await refetch();
  } catch {
    // Apollo exposes the mutation error through retryError below.
  } finally {
    retryingFileId.value = '';
  }
};

const discussionPath = (item: ReviewItem) => {
  if (!item.channelUniqueName) return null;
  return `/forums/${item.channelUniqueName}/downloads/${item.discussionId}`;
};

const pipelinePath = (item: ReviewItem) => {
  const path = discussionPath(item);
  return path ? `${path}/pipelines` : null;
};
</script>

<template>
  <section
    class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    data-testid="download-scan-review-queue"
  >
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Download security review queue
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Quarantined files remain unavailable until a scan passes or a reviewer releases them with an audit reason.
        </p>
      </div>
      <ShieldCheck class="h-5 w-5 text-orange-600 dark:text-orange-300" />
    </div>

    <p v-if="loading && !result" class="mt-4 text-sm text-gray-600 dark:text-gray-300">
      Loading security reviews…
    </p>
    <p v-else-if="error" class="mt-4 text-sm text-red-700 dark:text-red-300">
      {{ error.message }}
    </p>
    <p
      v-else-if="!result?.getDownloadScanReviewQueue?.length"
      class="mt-4 text-sm text-gray-600 dark:text-gray-300"
    >
      No downloads are waiting for security review.
    </p>

    <div v-else class="mt-4 space-y-3">
      <article
        v-for="item in result.getDownloadScanReviewQueue as ReviewItem[]"
        :key="item.downloadableFileId"
        class="rounded-md border border-gray-200 p-3 dark:border-gray-700"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ item.fileName }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ item.discussionTitle || item.discussionId }}
              <span v-if="item.uploaderUsername"> · {{ item.uploaderUsername }}</span>
            </p>
          </div>
          <span
            class="rounded-full px-2 py-1 text-xs font-medium"
            :class="item.scanStatus === 'INFECTED'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            : item.scanStatus === 'FAILED'
              ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'"
          >
            {{ item.scanStatus }}
          </span>
        </div>

        <p v-if="item.scanReason" class="mt-2 text-sm text-gray-700 dark:text-gray-200">
          Scanner: {{ item.scanReason }}
        </p>
        <p
          v-if="item.reviewRequestedAt"
          class="mt-2 text-sm font-medium text-orange-700 dark:text-orange-200"
        >
          Creator requested human review<span v-if="item.reviewRequestReason">: {{ item.reviewRequestReason }}</span>
        </p>

        <div class="mt-3 flex flex-col gap-2 md:flex-row md:items-end">
          <label class="flex-1 text-sm text-gray-700 dark:text-gray-200">
            Required release reason
            <input
              v-model="reviewNotes[item.downloadableFileId]"
              :aria-label="`Review note for ${item.fileName}`"
              class="mt-1 w-full rounded-md border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="Evidence supporting release"
            >
          </label>
          <NuxtLink
            v-if="discussionPath(item)"
            :to="discussionPath(item) || ''"
            class="text-sm font-medium text-orange-700 underline dark:text-orange-200"
          >
            Open download page
          </NuxtLink>
          <NuxtLink
            v-if="pipelinePath(item)"
            :to="pipelinePath(item) || ''"
            class="text-sm font-medium text-orange-700 underline dark:text-orange-200"
          >
            Review pipeline
          </NuxtLink>
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
            :disabled="retrying"
            @click="retryScan(item)"
          >
            {{ retrying && retryingFileId === item.downloadableFileId ? 'Retrying…' : 'Retry scan' }}
          </button>
          <button
            type="button"
            data-testid="release-quarantine"
            class="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-60"
            :disabled="clearing || !reviewNotes[item.downloadableFileId]?.trim()"
            @click="clearReview(item)"
          >
            {{ clearing && clearingFileId === item.downloadableFileId ? 'Releasing…' : 'Release quarantine' }}
          </button>
        </div>
      </article>
    </div>

    <p v-if="clearError" class="mt-3 text-sm text-red-700 dark:text-red-300">
      {{ clearError.message }}
    </p>
    <p v-if="retryError" class="mt-3 text-sm text-red-700 dark:text-red-300">
      {{ retryError.message }}
    </p>
  </section>
</template>
