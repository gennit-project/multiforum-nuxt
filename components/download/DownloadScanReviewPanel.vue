<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation } from '@vue/apollo-composable';
import {
  CLEAR_DOWNLOADABLE_FILE_SCAN,
  RETRY_DOWNLOADABLE_FILE_SCAN,
} from '@/graphQLData/discussion/mutations';
import { useIsAuthenticated, useUsername } from '@/composables/useAuthState';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { useToast } from '@/composables/useToast';

const props = defineProps<{
  downloadableFileId: string;
}>();

const isAuthenticated = useIsAuthenticated();
const username = useUsername();
const toast = useToast();
const { serverAdminUsernames } = useServerRoleMembership();

const reason = ref('');

// The backend enforces the server-level permission on both mutations; this
// only decides whether the controls are offered.
const isServerAdmin = computed(
  () =>
    isAuthenticated.value &&
    !!username.value &&
    serverAdminUsernames.value.includes(username.value)
);

const {
  mutate: clearDownloadableFileScan,
  loading: releasing,
  error: releaseError,
  onDone: onReleased,
} = useMutation(CLEAR_DOWNLOADABLE_FILE_SCAN);

const {
  mutate: retryDownloadableFileScan,
  loading: retrying,
  error: retryError,
  onDone: onRetryStarted,
} = useMutation(RETRY_DOWNLOADABLE_FILE_SCAN);

onReleased(() => {
  reason.value = '';
  toast.success('Quarantine released. The file is available to download.');
});

onRetryStarted(() => {
  toast.success('Scan restarted. Check back for the result.');
});

const canRelease = computed(
  () => !releasing.value && reason.value.trim().length > 0
);

const release = () => {
  if (!canRelease.value) return;
  clearDownloadableFileScan({
    downloadableFileId: props.downloadableFileId,
    reason: reason.value.trim(),
  });
};

const retry = () => {
  if (retrying.value) return;
  retryDownloadableFileScan({ downloadableFileId: props.downloadableFileId });
};
</script>

<template>
  <section
    v-if="isServerAdmin"
    aria-labelledby="scan-admin-review-heading"
    data-testid="download-scan-admin-review"
    class="mt-3 rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
  >
    <h3 id="scan-admin-review-heading" class="font-semibold">Admin review</h3>
    <p class="mt-1 text-xs text-gray-700 dark:text-gray-300">
      Quarantined files stay unavailable until a scan passes or you release them
      with an audit reason.
    </p>

    <label
      for="scan-release-reason"
      class="mt-3 block text-xs font-medium text-gray-700 dark:text-gray-200"
    >
      Required release reason
    </label>
    <input
      id="scan-release-reason"
      v-model="reason"
      type="text"
      class="mt-1 h-11 w-full rounded-md border-gray-300 text-sm dark:border-gray-600 dark:bg-gray-900"
      placeholder="Evidence supporting release"
    />

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        data-testid="release-quarantine"
        class="min-h-11 rounded-md bg-green-700 px-3 font-medium text-white hover:bg-green-800 disabled:opacity-60"
        :disabled="!canRelease"
        @click="release"
      >
        {{ releasing ? 'Releasing…' : 'Release quarantine' }}
      </button>
      <button
        type="button"
        data-testid="retry-scan"
        class="min-h-11 rounded-md border border-gray-300 px-3 font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
        :disabled="retrying"
        @click="retry"
      >
        {{ retrying ? 'Retrying…' : 'Retry scan' }}
      </button>
    </div>

    <p v-if="releaseError" class="mt-2 text-xs text-red-700 dark:text-red-300">
      {{ releaseError.message }}
    </p>
    <p v-if="retryError" class="mt-2 text-xs text-red-700 dark:text-red-300">
      {{ retryError.message }}
    </p>
  </section>
</template>
