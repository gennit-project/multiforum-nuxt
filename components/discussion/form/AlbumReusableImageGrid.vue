<script lang="ts" setup>
import { computed } from 'vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import AppImage from '@/components/image/AppImage.vue';
import ImageCaption from '@/components/image/ImageCaption.vue';
import type { ReusableImage } from './reusableImageTypes';

const props = withDefaults(defineProps<{
  images: ReusableImage[];
  selectedImageIds: string[];
  pendingImageIds?: string[];
  isLimitReached: boolean;
  loading: boolean;
  error?: string | null;
  emptyMessage?: string;
}>(), { pendingImageIds: () => [], error: null, emptyMessage: '' });

const emit = defineEmits<{
  toggleImage: [image: ReusableImage];
}>();

const inAlbumIds = computed(() => new Set(props.selectedImageIds));
const pendingIds = computed(() => new Set(props.pendingImageIds));

const isDisabled = (image: ReusableImage) =>
  inAlbumIds.value.has(image.id) ||
  (props.isLimitReached && !pendingIds.value.has(image.id));

const statusLabel = (image: ReusableImage) => {
  if (inAlbumIds.value.has(image.id)) return 'Already in album';
  if (pendingIds.value.has(image.id)) return 'Selected';
  if (props.isLimitReached) return 'Album limit reached';
  return '';
};

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

    <ul
      v-else
      class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
    >
      <li
        v-for="image in images"
        :key="image.id"
      >
        <button
          type="button"
          class="group relative block w-full overflow-hidden rounded-lg border-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed"
          :class="
            pendingIds.has(image.id)
              ? 'border-orange-500'
              : 'border-transparent'
          "
          data-testid="reuse-image-toggle"
          :aria-pressed="pendingIds.has(image.id)"
          :aria-label="`${getImageAlt(image)}. Uploaded by ${getUploaderLabel(image)}`"
          :disabled="isDisabled(image)"
          @click="emit('toggleImage', image)"
        >
          <AppImage
            :src="image.url"
            :alt="''"
            class="aspect-square w-full object-cover"
            :class="inAlbumIds.has(image.id) ? 'opacity-40' : ''"
            :width="160"
            :height="160"
            sizes="(min-width: 640px) 128px, 33vw"
            loading="lazy"
            decoding="async"
          />
          <span
            class="absolute top-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-md border text-white"
            :class="
              pendingIds.has(image.id)
                ? 'border-orange-600 bg-orange-600'
                : 'border-gray-400 bg-white/90 dark:bg-gray-800/90'
            "
            aria-hidden="true"
          >
            <svg
              v-if="pendingIds.has(image.id)"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="3"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </span>
          <span
            v-if="statusLabel(image) && !pendingIds.has(image.id)"
            class="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-0.5 text-center text-[11px] text-white"
          >
            {{ statusLabel(image) }}
          </span>
        </button>
        <ImageCaption
          v-if="image.caption"
          :text="image.caption"
          class="mt-1 line-clamp-1 hidden text-xs text-gray-700 sm:block dark:text-gray-300"
        />
        <p
          v-else
          class="mt-1 line-clamp-1 hidden text-xs text-gray-700 sm:block dark:text-gray-300"
        >
          {{ image.alt || image.id }}
        </p>
      </li>
    </ul>
  </div>
</template>
