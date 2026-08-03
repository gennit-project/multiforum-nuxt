<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref, computed } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';
import type { Album } from '@/__generated__/graphql';
import LeftArrowIcon from '@/components/icons/LeftArrowIcon.vue';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';

const props = defineProps({
  album: {
    type: Object as PropType<Album>,
    required: true,
  },
  carouselFormat: {
    type: Boolean,
    default: false,
  },
});

const activeIndex = ref(0);
const thumbnailStartIndex = ref(0);
const lightboxVisible = ref(false);

const galleryImages = computed(() =>
  props.album.Images.map((image) => image.url || '')
);
const activeImage = computed(() => props.album.Images[activeIndex.value]);

const openLightbox = (index: number) => {
  activeIndex.value = index;
  lightboxVisible.value = true;
};

const setActiveImage = (index: number) => {
  activeIndex.value = index;
};

const scrollThumbnailsLeft = () => {
  if (thumbnailStartIndex.value > 0) {
    thumbnailStartIndex.value--;
  }
};

const scrollThumbnailsRight = () => {
  const maxStart = Math.max(0, props.album.Images.length - 4);
  if (thumbnailStartIndex.value < maxStart) {
    thumbnailStartIndex.value++;
  }
};

const visibleThumbnails = computed(() => {
  return props.album.Images.slice(
    thumbnailStartIndex.value,
    thumbnailStartIndex.value + 4
  );
});

const canScrollLeft = computed(() => thumbnailStartIndex.value > 0);
const canScrollRight = computed(
  () => thumbnailStartIndex.value < props.album.Images.length - 4
);
</script>

<template>
  <div class="overflow-x-auto border">
    <div v-if="!carouselFormat" class="grid grid-cols-3 gap-2 dark:text-white">
      <button
        v-for="(image, index) in album.Images"
        :key="image.id"
        type="button"
        class="flex flex-col text-left"
        :aria-label="`View ${image.alt || `image ${index + 1}`} in gallery`"
        @click="openLightbox(index)"
      >
        <img
          :src="image.url || ''"
          :alt="image.alt || ''"
          class="shadow-sm"
        >
        <span class="text-center">
          {{ image.alt }}
        </span>
      </button>
    </div>

    <!-- Carousel format - show first image large, then thumbnails -->
    <div v-else class="flex flex-col items-center">
      <!-- Main image display -->
      <button
        v-if="activeImage"
        type="button"
        class="flex items-center justify-center"
        :aria-label="`View ${activeImage.alt || `image ${activeIndex + 1}`} in gallery`"
        @click="openLightbox(activeIndex)"
      >
        <img
          :src="activeImage.url || ''"
          :alt="activeImage.alt || ''"
          class="max-h-96 max-w-96 object-contain shadow-sm"
        >
      </button>

      <!-- Thumbnails with navigation -->
      <div v-if="album.Images.length > 1" class="mt-4 flex items-center gap-2">
        <!-- Left arrow -->
        <button
          class="flex items-center justify-center p-1 text-white hover:text-gray-300"
          :class="{ 'cursor-not-allowed opacity-50': !canScrollLeft }"
          :disabled="!canScrollLeft"
          aria-label="Scroll thumbnails left"
          @click="scrollThumbnailsLeft"
        >
          <LeftArrowIcon class="h-6 w-6" />
        </button>

        <!-- Thumbnail grid -->
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="(image, index) in visibleThumbnails"
            :key="`thumbnail-${thumbnailStartIndex + index}`"
            type="button"
            class="aspect-square h-20 w-20 cursor-pointer rounded border transition-all"
            :class="[
              activeIndex === thumbnailStartIndex + index
                ? 'border-2 border-orange-500'
                : 'border-gray-300 dark:border-gray-600',
              'bg-gray-100 dark:bg-gray-700',
            ]"
            :aria-label="`Show ${image.alt || `image ${thumbnailStartIndex + index + 1}`}`"
            @click="() => setActiveImage(thumbnailStartIndex + index)"
          >
            <img
              :src="image.url || ''"
              :alt="`Thumbnail ${thumbnailStartIndex + index + 1}`"
              class="h-full w-full object-cover transition-opacity hover:opacity-80"
            >
          </button>
        </div>

        <!-- Right arrow -->
        <button
          class="flex items-center justify-center p-1 text-white hover:text-gray-300"
          :class="{ 'cursor-not-allowed opacity-50': !canScrollRight }"
          :disabled="!canScrollRight"
          aria-label="Scroll thumbnails right"
          @click="scrollThumbnailsRight"
        >
          <RightArrowIcon class="h-6 w-6" />
        </button>
      </div>
    </div>

    <VueEasyLightbox
      v-if="lightboxVisible"
      :visible="lightboxVisible"
      :imgs="galleryImages"
      :index="activeIndex"
      @hide="lightboxVisible = false"
    />
  </div>
</template>
