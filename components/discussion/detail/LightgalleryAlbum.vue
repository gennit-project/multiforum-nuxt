<script lang="ts" setup>
import type { PropType } from "vue";
import { ref } from "vue";
import Lightgallery from "lightgallery/vue";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";
import { config } from "@/config";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-zoom.css";
import type { Album } from "@/__generated__/graphql";

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

const setActiveImage = (index: number) => {
  activeIndex.value = index;
};
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
      <a v-for="image in album.Images" :key="image.id" :href="image.url || ''">
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
            class="max-h-96 max-w-96 shadow-sm object-contain cursor-pointer"
          />
        </a>
      </lightgallery>

      <!-- Thumbnails for all images -->
      <div
        v-if="album.Images.length > 1"
        class="mt-4 grid grid-cols-4 gap-2"
      >
        <div
          v-for="(image, index) in album.Images.slice(0, 4)"
          :key="`thumbnail-${index}`"
          class="aspect-square h-20 w-20 overflow-hidden rounded border cursor-pointer transition-all"
          :class="[
            activeIndex === index 
              ? 'border-orange-500 border-2' 
              : 'border-gray-300 dark:border-gray-600',
            'bg-gray-100 dark:bg-gray-700'
          ]"
          @click="() => setActiveImage(index)"
        >
          <img
            :src="image.url"
            :alt="`Thumbnail ${index + 1}`"
            class="h-full w-full object-cover transition-opacity hover:opacity-80"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
img {
  cursor: pointer;
}
</style>