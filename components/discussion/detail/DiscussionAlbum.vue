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
});

const plugins = ref([lgThumbnail, lgZoom]);

const lightGalleryLicenseKey = config.lightgalleryLicenseKey;
</script>

<template>
  <lightgallery
    :settings="{
      speed: 500,
      plugins: plugins,
      licenseKey: lightGalleryLicenseKey,
    }"
    class="grid grid-cols-2 gap-2 dark:text-white"
  >
    <a v-for="image in album.Images" :key="image.id" :href="image.url">
      <img :src="image.url" :alt="image.alt" class="shadow-sm" />
      <figcaption class="text-center">
        {{ image.alt }}
      </figcaption>
    </a>
  </lightgallery>
</template>

<style scoped>
img {
  cursor: pointer;
}
</style>
