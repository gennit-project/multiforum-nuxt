<script lang="ts" setup>
  import type { PropType } from "vue";
  import { ref, computed } from "vue";
  import Lightgallery from "lightgallery/vue";
  import lgThumbnail from "lightgallery/plugins/thumbnail";
  import lgZoom from "lightgallery/plugins/zoom";
  import { config } from "@/config";
  import "lightgallery/css/lightgallery.css";
  import "lightgallery/css/lg-thumbnail.css";
  import "lightgallery/css/lg-zoom.css";
  import type { Album } from "@/__generated__/graphql";
  import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";
  import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";

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

  const plugins = ref([lgThumbnail, lgZoom]);
  const lightGalleryLicenseKey = config.lightgalleryLicenseKey;
  const activeIndex = ref(0);
  const thumbnailStartIndex = ref(0);

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
    return props.album.Images.slice(thumbnailStartIndex.value, thumbnailStartIndex.value + 4);
  });

  const canScrollLeft = computed(() => thumbnailStartIndex.value > 0);
  const canScrollRight = computed(() => thumbnailStartIndex.value < props.album.Images.length - 4);
</script>

<template>
  <div class="overflow-x-auto border">
    <lightgallery
      v-if="!carouselFormat"
      :settings="{
        speed: 500,
        plugins: plugins,
        licenseKey: lightGalleryLicenseKey,
      }"
      class="grid grid-cols-3 gap-2 dark:text-white"
    >
      <a
        v-for="image in album.Images"
        :key="image.id"
        :href="image.url || ''"
      >
        <img
          v-if="image"
          :src="image.url || ''"
          :alt="image.alt || ''"
          class="shadow-sm"
        >
        <span class="text-center">
          {{ image.alt }}
        </span>
      </a>
    </lightgallery>

    <!-- Carousel format - show first image large, then thumbnails -->
    <div
      v-else
      class="flex flex-col items-center"
    >
      <!-- Main image display -->
      <lightgallery
        :settings="{
          speed: 500,
          plugins: plugins,
          licenseKey: lightGalleryLicenseKey,
        }"
        class="flex items-center justify-center"
      >
        <!-- Gallery items for lightgallery -->
        <a
          v-for="(image, index) in album.Images"
          :key="image.id"
          :href="image.url || ''"
          :class="{ hidden: index !== activeIndex }"
        >
          <img
            :src="image.url || ''"
            :alt="image.alt || ''"
            class="max-h-96 max-w-96 cursor-pointer object-contain shadow-sm"
          >
        </a>
      </lightgallery>

      <!-- Thumbnails with navigation -->
      <div
        v-if="album.Images.length > 1"
        class="mt-4 flex items-center gap-2"
      >
        <!-- Left arrow -->
        <button
          class="flex items-center justify-center p-1 text-white hover:text-gray-300"
          :class="{ 'cursor-not-allowed opacity-50': !canScrollLeft }"
          :disabled="!canScrollLeft"
          @click="scrollThumbnailsLeft"
        >
          <LeftArrowIcon class="h-6 w-6" />
        </button>

        <!-- Thumbnail grid -->
        <div class="grid grid-cols-4 gap-2">
          <div
            v-for="(image, index) in visibleThumbnails"
            :key="`thumbnail-${thumbnailStartIndex + index}`"
            class="aspect-square h-20 w-20 cursor-pointer overflow-hidden rounded border transition-all"
            :class="[
              activeIndex === thumbnailStartIndex + index
                ? 'border-2 border-orange-500'
                : 'border-gray-300 dark:border-gray-600',
              'bg-gray-100 dark:bg-gray-700',
            ]"
            @click="() => setActiveImage(thumbnailStartIndex + index)"
          >
            <img
              :src="image.url"
              :alt="`Thumbnail ${thumbnailStartIndex + index + 1}`"
              class="h-full w-full object-cover transition-opacity hover:opacity-80"
            >
          </div>
        </div>

        <!-- Right arrow -->
        <button
          class="flex items-center justify-center p-1 text-white hover:text-gray-300"
          :class="{ 'cursor-not-allowed opacity-50': !canScrollRight }"
          :disabled="!canScrollRight"
          @click="scrollThumbnailsRight"
        >
          <RightArrowIcon class="h-6 w-6" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  img {
    cursor: pointer;
  }
</style>
