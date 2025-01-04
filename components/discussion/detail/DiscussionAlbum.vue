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
  <div class="overflow-x-auto">
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
      class=" p-4 flex rounded gap-x-2 dark:text-white max-h-96 max-w-96"
    >
      <a
        v-for="image in album.Images"
        :key="image.id"
        :href="image.url || ''"
        class=" flex flex-shrink-0 w-auto"
      >
        <div class="max-h-96 max-w-96">
          <img
            v-if="image"
            :src="image.url || ''"
            :alt="image.alt || ''"
            class="shadow-sm"
          >
          <span class="text-center">
            {{ image.alt }}
          </span>
        </div>
      </a>
    </lightgallery>
  </div>
</template>

<style scoped>
img {
  cursor: pointer;
}
</style>
