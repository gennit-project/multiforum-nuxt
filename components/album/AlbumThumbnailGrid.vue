<script lang="ts" setup>
import type { PropType } from 'vue';

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
</script>

<template>
  <div
    v-if="images.length > 0"
    class="grid gap-3"
    :class="columns"
  >
    <NuxtLink
      v-for="image in (maxImages > 0 ? images.slice(0, maxImages) : images)"
      :key="image.id"
      :to="`/u/${image.Uploader?.username}/images/${image.id}`"
      class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
    >
      <img
        :src="image.url || ''"
        :alt="image.alt || image.caption || 'Album image'"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
      >
      <div
        v-if="showCaptions && image.caption"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2"
      >
        <p class="line-clamp-2 text-xs text-white">
          {{ image.caption }}
        </p>
      </div>
    </NuxtLink>
  </div>
  <p
    v-else
    class="text-center text-gray-500 dark:text-gray-400"
  >
    No images in this album.
  </p>
</template>
