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

defineProps({
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
</script>

<template>
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

    <lightgallery
      v-else
      :settings="{
        speed: 500,
        plugins: plugins,
        licenseKey: lightGalleryLicenseKey,
      }"
      class="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 dark:text-white"
    >
      <a 
        v-for="image in album.Images" 
        :key="image.id" 
        :href="image.url || ''"
        class="flex-none w-3/4 first:pl-4 last:pr-4 snap-center flex flex-col"
      >
        <div class="relative w-full pt-[56.25%]">
          <img 
            v-if="image" 
            :src="image.url || ''" 
            :alt="image.alt || ''" 
            class="absolute inset-0 w-full h-full object-contain bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm"
          >
        </div>
        <span class="text-center mt-2">
          {{ image.alt }}
        </span>
      </a>
    </lightgallery>
</template>
<style scoped>
img {
  cursor: pointer;
}
</style>
