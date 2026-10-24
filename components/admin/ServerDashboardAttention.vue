<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { Flag, ShieldX } from 'lucide-vue-next';
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

const props = defineProps<{
  openIssueCount: number;
  /** Age in days of the oldest open admin issue, when known. */
  oldestOpenIssueAgeDays?: number | null;
  /** Channel that the oldest open admin issue belongs to, when known. */
  oldestOpenIssueChannel?: string | null;
}>();

const SCAN_STATUS_LABELS: Record<ReviewItem['scanStatus'], string> = {
  INFECTED: 'Infected',
  FAILED: 'Scan failed',
  SUSPICIOUS: 'Suspicious',
};

const reviewNotes = ref<Record<string, string>>({});
const expandedFileId = ref('');
const clearingFileId = ref('');
const retryingFileId = ref('');

const { result, loading, error, refetch } = useQuery(
  GET_DOWNLOAD_SCAN_REVIEW_QUEUE,
  { limit: 50 },
  {
    fetchPolicy: 'cache-and-network',
    prefetch: false,
  }
);

const {
  mutate: clearDownloadableFileScan,
  loading: clearing,
  error: clearError,
  onDone: onClearDone,
} = useMutation(CLEAR_DOWNLOADABLE_FILE_SCAN);

const {
  mutate: retryDownloadableFileScan,
  loading: retrying,
  error: retryError,
  onDone: onRetryDone,
} = useMutation(RETRY_DOWNLOADABLE_FILE_SCAN);

onClearDone(() => {
  expandedFileId.value = '';
  refetch();
});
onRetryDone(() => {
  refetch();
});

const reviewItems = computed<ReviewItem[]>(
  () => result.value?.getDownloadScanReviewQueue || []
);

const showOpenIssues = computed(() => props.openIssueCount > 0);

const attentionCount = computed(
  () => reviewItems.value.length + (showOpenIssues.value ? 1 : 0)
);

const hasNothingToReview = computed(
  () => !loading.value && !error.value && attentionCount.value === 0
);

const toggleReview = (item: ReviewItem) => {
  expandedFileId.value =
    expandedFileId.value === item.downloadableFileId
      ? ''
      : item.downloadableFileId;
};

const clearReview = (item: ReviewItem) => {
  const reason = reviewNotes.value[item.downloadableFileId]?.trim();
  if (clearing.value || !reason) return;
  clearingFileId.value = item.downloadableFileId;
  clearDownloadableFileScan({
    downloadableFileId: item.downloadableFileId,
    reason,
  });
};

const retryScan = (item: ReviewItem) => {
  if (retrying.value) return;
  retryingFileId.value = item.downloadableFileId;
  retryDownloadableFileScan({
    downloadableFileId: item.downloadableFileId,
  });
};

const discussionPath = (item: ReviewItem) => {
  if (!item.channelUniqueName) return null;
  return `/forums/${item.channelUniqueName}/downloads/${item.discussionId}`;
};

const pipelinePath = (item: ReviewItem) => {
  const path = discussionPath(item);
  return path ? `${path}/pipelines` : null;
};

const pluralize = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? '' : 's'}`;

const openIssuesDetail = computed(() => {
  const age = props.oldestOpenIssueAgeDays;
  if (age == null) return 'Review and resolve them from the issues list.';
  const where = props.oldestOpenIssueChannel
    ? `, in ${props.oldestOpenIssueChannel}`
    : '';
  return `Oldest is ${pluralize(age, 'day')} old${where}.`;
});
</script>

<template>
  <section
    aria-labelledby="attention-heading"
    data-testid="server-dashboard-attention"
    class="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white !text-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:!text-gray-100"
  >
    <div class="flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <h2
          id="attention-heading"
          class="text-base font-semibold !text-gray-900 dark:!text-gray-100"
        >
          Needs attention
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Things only an admin can resolve, most urgent first.
        </p>
      </div>
      <span
        v-if="attentionCount > 0"
        data-testid="attention-count"
        class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-red-800 dark:bg-red-900/40 dark:text-red-200"
      >
        {{ pluralize(attentionCount, 'item') }}
      </span>
    </div>

    <p
      v-if="loading && !result"
      class="border-t border-gray-200 px-5 py-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300"
    >
      Loading security reviews…
    </p>
    <p
      v-else-if="error"
      class="border-t border-gray-200 px-5 py-4 text-sm text-red-700 dark:border-gray-800 dark:text-red-300"
    >
      {{ error.message }}
    </p>
    <p
      v-else-if="hasNothingToReview"
      data-testid="attention-empty"
      class="border-t border-gray-200 px-5 py-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300"
    >
      Nothing needs your attention right now.
    </p>

    <article
      v-for="item in reviewItems"
      :key="item.downloadableFileId"
      data-testid="scan-review-item"
      class="border-t border-gray-200 px-5 py-4 dark:border-gray-800"
    >
      <div class="flex flex-wrap items-center gap-3.5">
        <span
          aria-hidden="true"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        >
          <ShieldX class="h-[18px] w-[18px]" />
        </span>
        <div class="min-w-0 flex-[1_1_16rem]">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold break-all">{{ item.fileName }}</span>
            <span
              class="rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
              :class="
                item.scanStatus === 'SUSPICIOUS'
                  ? 'border-yellow-600/40 text-yellow-800 dark:border-yellow-400/40 dark:text-yellow-300'
                  : 'border-red-600/40 text-red-700 dark:border-red-400/40 dark:text-red-300'
              "
            >
              {{ SCAN_STATUS_LABELS[item.scanStatus] }}
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ item.discussionTitle || item.discussionId }}
            <span v-if="item.uploaderUsername">
              · {{ item.uploaderUsername }}</span
            >
            <span v-if="item.scanReason"> · {{ item.scanReason }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-11 rounded-lg border border-gray-300 px-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
            :aria-label="`Retry scan for ${item.fileName}`"
            :disabled="retrying"
            @click="retryScan(item)"
          >
            {{
              retrying && retryingFileId === item.downloadableFileId
                ? 'Retrying…'
                : 'Retry scan'
            }}
          </button>
          <button
            type="button"
            data-testid="review-toggle"
            class="min-h-11 rounded-lg bg-brand-500 px-3.5 text-sm font-semibold text-gray-950 hover:bg-brand-400"
            :aria-label="`${expandedFileId === item.downloadableFileId ? 'Close review of' : 'Review'} ${item.fileName}`"
            :aria-expanded="expandedFileId === item.downloadableFileId"
            :aria-controls="`review-panel-${item.downloadableFileId}`"
            @click="toggleReview(item)"
          >
            {{ expandedFileId === item.downloadableFileId ? 'Close' : 'Review' }}
          </button>
        </div>
      </div>

      <div
        v-if="expandedFileId === item.downloadableFileId"
        :id="`review-panel-${item.downloadableFileId}`"
        class="mt-3.5 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60"
      >
        <p class="text-sm text-gray-700 dark:text-gray-300">
          Quarantined files stay unavailable until a scan passes or you release
          them with an audit reason.
        </p>
        <p
          v-if="item.reviewRequestedAt"
          class="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Creator requested human review<span v-if="item.reviewRequestReason"
            >: {{ item.reviewRequestReason }}</span
          >
        </p>
        <div class="flex flex-wrap items-end gap-3">
          <div class="min-w-64 flex-1">
            <label
              :for="`release-reason-${item.downloadableFileId}`"
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Required release reason
            </label>
            <input
              :id="`release-reason-${item.downloadableFileId}`"
              v-model="reviewNotes[item.downloadableFileId]"
              class="h-11 w-full rounded-lg border-gray-300 text-sm dark:border-gray-700 dark:bg-gray-900"
              placeholder="Evidence supporting release"
            />
          </div>
          <button
            type="button"
            data-testid="release-quarantine"
            class="min-h-11 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            :disabled="
              clearing || !reviewNotes[item.downloadableFileId]?.trim()
            "
            @click="clearReview(item)"
          >
            {{
              clearing && clearingFileId === item.downloadableFileId
                ? 'Releasing…'
                : 'Release quarantine'
            }}
          </button>
          <NuxtLink
            v-if="discussionPath(item)"
            :to="discussionPath(item) || ''"
            class="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 underline dark:text-blue-300"
          >
            Open download page
          </NuxtLink>
          <NuxtLink
            v-if="pipelinePath(item)"
            :to="pipelinePath(item) || ''"
            class="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 underline dark:text-blue-300"
          >
            Review pipeline
          </NuxtLink>
        </div>
      </div>
    </article>

    <div
      v-if="showOpenIssues"
      data-testid="attention-open-issues"
      class="flex flex-wrap items-center gap-3.5 border-t border-gray-200 px-5 py-4 dark:border-gray-800"
    >
      <span
        aria-hidden="true"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
      >
        <Flag class="h-[18px] w-[18px]" />
      </span>
      <div class="min-w-0 flex-[1_1_16rem]">
        <p class="font-semibold">
          {{ pluralize(openIssueCount, 'admin issue') }}
          {{ openIssueCount === 1 ? 'is' : 'are' }} still open
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ openIssuesDetail }}
        </p>
      </div>
      <NuxtLink
        to="/admin/issues"
        class="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-3.5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
      >
        Open issues
      </NuxtLink>
    </div>

    <p
      v-if="clearError"
      class="border-t border-gray-200 px-5 py-3 text-sm text-red-700 dark:border-gray-800 dark:text-red-300"
    >
      {{ clearError.message }}
    </p>
    <p
      v-if="retryError"
      class="border-t border-gray-200 px-5 py-3 text-sm text-red-700 dark:border-gray-800 dark:text-red-300"
    >
      {{ retryError.message }}
    </p>
  </section>
</template>
