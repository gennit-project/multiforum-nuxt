<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { GET_REUSABLE_ALBUM_IMAGES } from '@/graphQLData/image/queries';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import type { ImageWhere } from '@/__generated__/graphql';

type ReusableImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  copyright?: string | null;
  createdAt?: string | null;
  Uploader?: {
    username?: string | null;
    displayName?: string | null;
  } | null;
};

type ReusableImageResult = {
  users?: Array<{
    Images?: ReusableImage[] | null;
    FavoriteImages?: ReusableImage[] | null;
    Collections?: Array<{
      id: string;
      name?: string | null;
      Images?: ReusableImage[] | null;
    }> | null;
  }> | null;
};

type PickerImage = ReusableImage & {
  sourceLabels: string[];
};

const props = defineProps<{
  selectedImageIds: string[];
  isLimitReached: boolean;
}>();

const emit = defineEmits<{
  addImage: [image: ReusableImage];
}>();

const usernameVar = useUsername();
const searchTerm = ref('');
const limit = 30;

const selectedImageIdsSet = computed(() => new Set(props.selectedImageIds));

const imageWhere = computed<ImageWhere>(() => {
  const base: ImageWhere = {
    archived: false,
    permanentlyRemoved: false,
  };
  const trimmedSearch = searchTerm.value.trim();

  if (!trimmedSearch) {
    return base;
  }

  return {
    AND: [
      base,
      {
        OR: [
          { id_CONTAINS: trimmedSearch },
          { url_CONTAINS: trimmedSearch },
          { alt_CONTAINS: trimmedSearch },
          { caption_CONTAINS: trimmedSearch },
          { copyright_CONTAINS: trimmedSearch },
        ],
      },
    ],
  };
});

const { result, loading, error } = useQuery<ReusableImageResult>(
  GET_REUSABLE_ALBUM_IMAGES,
  () => ({
    username: usernameVar.value,
    where: imageWhere.value,
    limit,
  }),
  () => ({
    enabled: Boolean(usernameVar.value),
    fetchPolicy: 'cache-and-network',
  })
);

const pushImage = (
  map: Map<string, PickerImage>,
  image: ReusableImage,
  sourceLabel: string
) => {
  if (!image.id) return;

  const existing = map.get(image.id);
  if (existing) {
    if (!existing.sourceLabels.includes(sourceLabel)) {
      existing.sourceLabels.push(sourceLabel);
    }
    return;
  }

  map.set(image.id, {
    ...image,
    sourceLabels: [sourceLabel],
  });
};

const images = computed<PickerImage[]>(() => {
  const user = result.value?.users?.[0];
  const imageMap = new Map<string, PickerImage>();

  for (const image of user?.Images || []) {
    pushImage(imageMap, image, 'Your uploads');
  }

  for (const image of user?.FavoriteImages || []) {
    pushImage(imageMap, image, 'Favorites');
  }

  for (const collection of user?.Collections || []) {
    const collectionName = collection.name || 'Image collection';
    for (const image of collection.Images || []) {
      pushImage(imageMap, image, collectionName);
    }
  }

  return [...imageMap.values()];
});

const getImageAlt = (image: ReusableImage) =>
  image.alt || image.caption || 'Reusable album image';

const getUploaderLabel = (image: ReusableImage) => {
  const uploader = image.Uploader;
  if (!uploader?.username) return 'Unknown uploader';
  return uploader.displayName
    ? `${uploader.displayName} (${uploader.username})`
    : uploader.username;
};
</script>

<template>
  <section
    class="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-900/40"
    aria-labelledby="existing-image-picker-heading"
  >
    <div class="mb-3">
      <h4
        id="existing-image-picker-heading"
        class="text-sm font-semibold text-gray-900 dark:text-white"
      >
        Add an existing image
      </h4>
      <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
        Reuse images from your uploads, favorites, or image collections without
        re-uploading. Original uploader attribution is preserved.
      </p>
    </div>

    <label
      class="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-200"
      for="existing-image-search"
    >
      Search reusable images
    </label>
    <input
      id="existing-image-search"
      v-model="searchTerm"
      type="search"
      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      placeholder="Search by caption, alt text, URL, or image ID"
    >

    <ErrorBanner
      v-if="error"
      class="mt-3"
      :text="error.message"
    />

    <div
      v-if="loading && images.length === 0"
      class="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
    >
      <LoadingSpinner class="h-4 w-4" />
      <span>Loading reusable images...</span>
    </div>

    <p
      v-else-if="images.length === 0"
      class="mt-3 text-sm text-gray-600 dark:text-gray-300"
    >
      No reusable images found.
    </p>

    <div
      v-else
      class="mt-3 grid max-h-96 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3"
    >
      <article
        v-for="image in images"
        :key="image.id"
        class="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <img
          :src="image.url"
          :alt="getImageAlt(image)"
          class="h-32 w-full object-cover"
          loading="lazy"
        >
        <div class="space-y-2 p-3">
          <p class="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
            {{ image.caption || image.alt || image.id }}
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-300">
            Uploaded by {{ getUploaderLabel(image) }}
          </p>
          <p class="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
            {{ image.sourceLabels.join(' · ') }}
          </p>
          <button
            type="button"
            class="w-full rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            :disabled="selectedImageIdsSet.has(image.id) || isLimitReached"
            @click="emit('addImage', image)"
          >
            <span v-if="selectedImageIdsSet.has(image.id)">Already in album</span>
            <span v-else-if="isLimitReached">Album limit reached</span>
            <span v-else>Add to album</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
