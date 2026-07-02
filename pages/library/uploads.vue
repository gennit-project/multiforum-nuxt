<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import WarningModal from '@/components/WarningModal.vue';
import { useUsername } from '@/composables/useAuthState';
import { GET_UPLOADED_DOWNLOADABLE_FILES } from '@/graphQLData/user/queries';
import { PERMANENTLY_DELETE_DOWNLOADABLE_FILE } from '@/graphQLData/discussion/mutations';

type UploadedFile = {
  id: string;
  fileName: string;
  kind?: string | null;
  size?: number | null;
  url?: string | null;
  uploadedAt?: string | null;
  createdAt?: string | null;
};

type UploadedDownloadGroup = {
  discussion: {
    id: string;
    title: string;
    channelUniqueNames?: string[];
  };
  files: UploadedFile[];
};

const usernameVar = useUsername();
const pendingDeleteFile = ref<UploadedFile | null>(null);

useHead({
  title: 'Uploaded Files - Library',
});

const {
  result,
  loading,
  error,
  refetch,
} = useQuery(
  GET_UPLOADED_DOWNLOADABLE_FILES,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
    fetchPolicy: 'cache-and-network',
  })
);

const {
  mutate: permanentlyDeleteDownloadableFile,
  loading: deleteLoading,
  error: deleteError,
} = useMutation(PERMANENTLY_DELETE_DOWNLOADABLE_FILE);

const groups = computed<UploadedDownloadGroup[]>(() => {
  return result.value?.getUploadedDownloadableFiles || [];
});

const totalFiles = computed(() =>
  groups.value.reduce((count, group) => count + group.files.length, 0)
);

const formatFileSize = (size?: number | null) => {
  if (!size) {
    return '0 MB';
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const getDiscussionPath = (group: UploadedDownloadGroup) => {
  const channelUniqueName = group.discussion.channelUniqueNames?.[0];

  if (!channelUniqueName) {
    return `/discussions/${group.discussion.id}`;
  }

  return `/forums/${channelUniqueName}/downloads/${group.discussion.id}`;
};

const confirmDelete = (file: UploadedFile) => {
  pendingDeleteFile.value = file;
};

const closeDeleteModal = () => {
  if (deleteLoading.value) {
    return;
  }

  pendingDeleteFile.value = null;
};

const deleteSelectedFile = async () => {
  if (!pendingDeleteFile.value) {
    return;
  }

  try {
    await permanentlyDeleteDownloadableFile({
      downloadableFileId: pendingDeleteFile.value.id,
    });
    pendingDeleteFile.value = null;
    await refetch();
  } catch (err) {
    console.error('Error permanently deleting uploaded file:', err);
  }
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div class="mb-8">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600 dark:text-orange-300">
              Data control
            </p>
            <h1 class="mt-2 text-3xl font-bold tracking-tight text-gray-950 dark:text-white">
              Uploaded Files
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
              Files you uploaded to downloads, grouped by the discussion where they are attached.
              Permanent delete removes the backing file from storage.
            </p>
          </div>

          <div v-if="loading" class="py-10 text-center">
            <div class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500" />
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Loading uploaded files...
            </p>
          </div>

          <ErrorBanner
            v-else-if="error"
            :text="`Error loading uploaded files: ${error.message}`"
          />

          <div
            v-else-if="totalFiles === 0"
            class="rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900"
          >
            <i class="fa-regular fa-folder-open text-4xl text-gray-400" />
            <h2 class="mt-4 text-lg font-semibold text-gray-950 dark:text-white">
              No uploaded files yet
            </h2>
            <p class="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
              Files you upload to download posts will appear here so you can find and delete them later.
            </p>
          </div>

          <div v-else class="space-y-5">
            <article
              v-for="group in groups"
              :key="group.discussion.id"
              class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div class="border-b border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-950/60">
                <NuxtLink
                  :to="getDiscussionPath(group)"
                  class="text-lg font-semibold text-gray-950 hover:text-orange-600 dark:text-white dark:hover:text-orange-300"
                >
                  {{ group.discussion.title }}
                </NuxtLink>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ group.files.length }} uploaded file{{ group.files.length === 1 ? '' : 's' }}
                </p>
              </div>

              <ul class="divide-y divide-gray-100 dark:divide-gray-800">
                <li
                  v-for="file in group.files"
                  :key="file.id"
                  class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div class="min-w-0">
                    <p class="truncate font-medium text-gray-900 dark:text-gray-100">
                      {{ file.fileName }}
                    </p>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {{ file.kind || 'File' }} · {{ formatFileSize(file.size) }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                    @click="confirmDelete(file)"
                  >
                    Permanently delete
                  </button>
                </li>
              </ul>
            </article>
          </div>

          <ErrorBanner
            v-if="deleteError"
            class="mt-4"
            :text="deleteError.message"
          />

          <WarningModal
            :open="!!pendingDeleteFile"
            title="Permanently delete this uploaded file?"
            body="This removes the file from its download post and permanently deletes the backing file from storage. This cannot be undone."
            icon="trash"
            primary-button-text="Permanently delete"
            :loading="deleteLoading"
            data-testid="uploaded-file-delete-modal"
            @close="closeDeleteModal"
            @primary-button-click="deleteSelectedFile"
          />
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-md py-12 text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In Required
          </h1>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Please sign in to manage uploaded files.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
