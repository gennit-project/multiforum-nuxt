<script lang="ts" setup>
import type { PropType } from 'vue';
import AppImage from '@/components/image/AppImage.vue';
import { getPreferredImageUrl } from '@/utils/imageVariants';

type AlbumImage = {
  id: string;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  Uploader?: {
    username?: string | null;
  } | null;
};

defineProps({
  images: {
    type: Array as PropType<AlbumImage[]>,
    required: true,
  },
  maxImages: {
    type: Number,
    default: 0, // 0 means show all
  },
  showCaptions: {
    type: Boolean,
    default: true,
  },
  columns: {
    type: String,
    default: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  },
});

const getImageUrl = (image: AlbumImage) =>
  getPreferredImageUrl({
    source: image,
    preferred: ['list320', 'list160'],
    originalUrl: image.url,
  }) || '';
</script>

<template>
  <div v-if="images.length > 0" class="grid gap-3" :class="columns">
    <NuxtLink
      v-for="image in maxImages > 0 ? images.slice(0, maxImages) : images"
      :key="image.id"
      :to="`/u/${image.Uploader?.username}/images/${image.id}`"
      class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      <AppImage
        :src="getImageUrl(image)"
        :alt="image.alt || image.caption || 'Album image'"
        class="h-full w-full object-cover"
        :width="320"
        :height="320"
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        loading="lazy"
        decoding="async"
      />
      <div
        v-if="showCaptions && image.caption"
        class="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent p-2"
      >
        <p class="line-clamp-2 text-xs text-white">
          {{ image.caption }}
        </p>
      </div>
    </NuxtLink>
  </div>
  <p v-else class="text-center text-gray-500 dark:text-gray-400">
    No images in this album.
  </p>
</template>
