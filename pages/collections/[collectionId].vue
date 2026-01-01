<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import { GET_PUBLIC_COLLECTION_BY_ID } from '@/graphQLData/collection/queries';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import CollectionDownloadListItem from '@/components/collection/CollectionDownloadListItem.vue';

const route = useRoute();

const collectionId = computed(() => {
  return typeof route.params.collectionId === 'string'
    ? route.params.collectionId
    : '';
});

const DOWNLOAD_LIMIT = 20;
const downloads = ref<any[]>([]);
const totalDownloads = ref<number>(0);
const downloadOffset = ref(0);

const { result, loading, error, refetch } = useQuery(
  GET_PUBLIC_COLLECTION_BY_ID,
  {
    collectionId: collectionId,
    downloadLimit: DOWNLOAD_LIMIT,
    downloadOffset: downloadOffset,
  },
  {
    fetchPolicy: 'cache-first',
    enabled: computed(() => !!collectionId.value),
  }
);

const collection = computed(() => result.value?.collections?.[0] || null);

watch(
  () => result.value,
  (val) => {
    const collectionData = val?.collections?.[0];
    if (!collectionData) return;

    totalDownloads.value = collectionData.DownloadsAggregate?.count || 0;

    const newDownloads = collectionData.Downloads || [];
    const existingIds = new Set(downloads.value.map((d) => d.id));
    const merged = [...downloads.value];
    newDownloads.forEach((d: any) => {
      if (d && !existingIds.has(d.id)) {
        merged.push(d);
      }
    });
    downloads.value = merged;
  },
  { immediate: true }
);

const hasMoreDownloads = computed(
  () => downloads.value.length < (totalDownloads.value || 0)
);

const loadingMore = ref(false);

const loadMore = async () => {
  if (!hasMoreDownloads.value || loadingMore.value) return;
  loadingMore.value = true;
  downloadOffset.value = downloads.value.length;
  try {
    await refetch?.();
  } finally {
    loadingMore.value = false;
  }
};
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto w-full max-w-6xl px-3 py-6">
      <LoadingSpinner
        v-if="loading && !collection"
        class="py-6"
        :loading-text="'Loading collection...'"
      />
      <ErrorBanner
        v-else-if="error"
        :text="error.message"
        class="mb-4"
      />
      <div v-else-if="collection" class="space-y-4">
        <div class="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ collection.name }}
            </h1>
            <span class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-900 dark:text-green-200">
              Public
            </span>
          </div>
          <p class="text-sm text-gray-700 dark:text-gray-200">
            {{ collection.description || 'No description provided.' }}
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            {{ collection.itemCount || 0 }} items · {{ collection.collectionType?.toLowerCase() || 'collection' }}
            <span v-if="collection.CreatedBy">
              · by
              {{
                collection.CreatedBy.displayName
                  ? `${collection.CreatedBy.displayName} (${collection.CreatedBy.username})`
                  : collection.CreatedBy.username
              }}
            </span>
          </p>
        </div>

        <div class="space-y-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Downloads in this collection
            </h2>
            <span class="text-xs text-gray-600 dark:text-gray-400">
              Showing up to 20 downloads
            </span>
          </div>
          <div
            v-if="collection.Downloads?.length"
            class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            <CollectionDownloadListItem
              v-for="download in downloads"
              :key="download.id"
              :discussion="download"
            />
          </div>
          <div
            v-if="hasMoreDownloads"
            class="mt-3 flex justify-center"
          >
            <button
              class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? 'Loading...' : 'Load more' }}
            </button>
          </div>
          <p
            v-else
            class="text-sm text-gray-600 dark:text-gray-300"
          >
            No downloads available in this collection.
          </p>
        </div>
      </div>
      <div v-else class="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
        This collection is not available or is not public.
      </div>
    </div>
  </NuxtLayout>
</template>
