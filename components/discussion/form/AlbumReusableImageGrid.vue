<script lang="ts" setup>
import { computed } from 'vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import type { ReusableImage } from './reusableImageTypes';

const props = defineProps<{
  images: ReusableImage[];
  selectedImageIds: string[];
  isLimitReached: boolean;
  loading: boolean;
  error?: string | null;
  emptyMessage?: string;
}>();

const emit = defineEmits<{
  addImage: [image: ReusableImage];
}>();

const selectedImageIdsSet = computed(() => new Set(props.selectedImageIds));

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
  <div>
    <ErrorBanner
      v-if="error"
      class="mt-3"
      :text="error"
    />

    <div
      v-if="loading && images.length === 0"
      class="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
    >
      <LoadingSpinner class="h-4 w-4" />
      <span>Loading images...</span>
    </div>

    <p
      v-else-if="images.length === 0"
      class="mt-3 text-sm text-gray-600 dark:text-gray-300"
    >
      {{ emptyMessage || 'No images found.' }}
    </p>

    <div
      v-else
      class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
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
          <button
            type="button"
            class="w-full rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            data-testid="reuse-image-add-button"
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
  </div>
</template>
