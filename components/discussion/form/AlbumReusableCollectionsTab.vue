<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import {
  GET_REUSABLE_IMAGE_COLLECTIONS,
  GET_REUSABLE_COLLECTION_IMAGES,
} from '@/graphQLData/image/queries';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import AlbumReusableImageGrid from './AlbumReusableImageGrid.vue';
import LoadMore from '@/components/LoadMore.vue';
import { buildReusableImageWhere } from './reusableImageTypes';
import type { ReusableImage } from './reusableImageTypes';

const PAGE_SIZE = 24;

type ImageCollection = {
  id: string;
  name?: string | null;
  itemCount?: number | null;
};

type CollectionsResult = {
  users?: Array<{
    Collections?: ImageCollection[] | null;
  }> | null;
};

type CollectionImagesResult = {
  collections?: Array<{
    id: string;
    name?: string | null;
    Images?: ReusableImage[] | null;
    ImagesAggregate?: { count?: number | null } | null;
  }> | null;
};

const props = defineProps<{
  searchTerm: string;
  selectedImageIds: string[];
  isLimitReached: boolean;
}>();

const emit = defineEmits<{
  addImage: [image: ReusableImage];
}>();

const usernameVar = useUsername();
const selectedCollectionId = ref<string | null>(null);
const currentOffset = ref(0);
const isLoadingMore = ref(false);

const buildImageVariables = (offset: number) => ({
  collectionId: selectedCollectionId.value,
  where: buildReusableImageWhere(props.searchTerm),
  offset,
  limit: PAGE_SIZE,
});

const {
  result: collectionsResult,
  loading: collectionsLoading,
  error: collectionsError,
} = useQuery<CollectionsResult>(
  GET_REUSABLE_IMAGE_COLLECTIONS,
  () => ({ username: usernameVar.value }),
  () => ({
    enabled: Boolean(usernameVar.value),
    fetchPolicy: 'cache-and-network',
  })
);

const collections = computed<ImageCollection[]>(() => {
  const all = collectionsResult.value?.users?.[0]?.Collections || [];
  const trimmed = props.searchTerm.trim().toLowerCase();
  if (!trimmed) return all;
  return all.filter((collection) =>
    (collection.name || '').toLowerCase().includes(trimmed)
  );
});

const {
  result: collectionImagesResult,
  loading: collectionImagesLoading,
  error: collectionImagesError,
  fetchMore,
} = useQuery<CollectionImagesResult>(
  GET_REUSABLE_COLLECTION_IMAGES,
  () => buildImageVariables(0),
  () => ({
    enabled: Boolean(selectedCollectionId.value),
    fetchPolicy: 'cache-and-network',
  })
);

const collectionsErrorMessage = computed(
  () => collectionsError.value?.message ?? null
);
const collectionImagesErrorMessage = computed(
  () => collectionImagesError.value?.message ?? null
);

const selectedCollection = computed(
  () => collectionImagesResult.value?.collections?.[0] || null
);

const collectionImages = computed<ReusableImage[]>(
  () => selectedCollection.value?.Images || []
);

const collectionImagesTotal = computed(
  () => selectedCollection.value?.ImagesAggregate?.count ?? 0
);

const hasMoreCollectionImages = computed(
  () => collectionImages.value.length < collectionImagesTotal.value
);

// Restart image paging whenever the chosen collection or the search changes;
// the base query refetches at offset 0, so keep our cursor in sync.
watch([selectedCollectionId, () => props.searchTerm], () => {
  currentOffset.value = 0;
});

const loadMoreCollectionImages = async () => {
  if (!hasMoreCollectionImages.value || isLoadingMore.value) return;

  const newOffset = currentOffset.value + PAGE_SIZE;
  isLoadingMore.value = true;

  try {
    await fetchMore({
      variables: buildImageVariables(newOffset),
      updateQuery: (previous: CollectionImagesResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previous;
        const prevCollection = previous.collections?.[0];
        const nextCollection = fetchMoreResult.collections?.[0];
        if (!prevCollection || !nextCollection) return previous;

        return {
          ...previous,
          collections: [
            {
              ...prevCollection,
              Images: [
                ...(prevCollection.Images || []),
                ...(nextCollection.Images || []),
              ],
              ImagesAggregate: nextCollection.ImagesAggregate,
            },
          ],
        };
      },
    });

    currentOffset.value = newOffset;
  } finally {
    isLoadingMore.value = false;
  }
};

const selectedCollectionName = computed(() => {
  if (selectedCollection.value?.name) return selectedCollection.value.name;
  const fromList = collections.value.find(
    (collection) => collection.id === selectedCollectionId.value
  );
  return fromList?.name || 'Image collection';
});

const openCollection = (id: string) => {
  selectedCollectionId.value = id;
};

const backToCollections = () => {
  selectedCollectionId.value = null;
};
</script>

<template>
  <div>
    <!-- Collection list view -->
    <div v-if="!selectedCollectionId">
      <ErrorBanner
        v-if="collectionsErrorMessage"
        class="mt-3"
        :text="collectionsErrorMessage"
      />

      <div
        v-if="collectionsLoading && collections.length === 0"
        class="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
      >
        <LoadingSpinner class="h-4 w-4" />
        <span>Loading collections...</span>
      </div>

      <p
        v-else-if="collections.length === 0"
        class="mt-3 text-sm text-gray-600 dark:text-gray-300"
      >
        You have no image collections yet.
      </p>

      <ul
        v-else
        class="mt-3 space-y-2"
      >
        <li
          v-for="collection in collections"
          :key="collection.id"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm hover:border-orange-400 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-orange-500 dark:hover:bg-gray-700"
            data-testid="reuse-image-collection-button"
            @click="openCollection(collection.id)"
          >
            <span class="font-medium">{{ collection.name || 'Untitled collection' }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ collection.itemCount ?? 0 }}
              {{ (collection.itemCount ?? 0) === 1 ? 'image' : 'images' }}
            </span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Selected collection view -->
    <div v-else>
      <button
        type="button"
        class="mt-1 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-orange-400 dark:hover:text-orange-300"
        @click="backToCollections"
      >
        <span aria-hidden="true">&larr;</span>
        All collections
      </button>
      <h5 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
        {{ selectedCollectionName }}
      </h5>

      <AlbumReusableImageGrid
        :images="collectionImages"
        :selected-image-ids="selectedImageIds"
        :is-limit-reached="isLimitReached"
        :loading="collectionImagesLoading"
        :error="collectionImagesErrorMessage"
        empty-message="This collection has no images."
        @add-image="emit('addImage', $event)"
      />

      <LoadMore
        v-if="collectionImages.length > 0"
        class="mt-2"
        :loading="isLoadingMore"
        :reached-end-of-results="!hasMoreCollectionImages"
        @load-more="loadMoreCollectionImages"
      />
    </div>
  </div>
</template>
