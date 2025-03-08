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
import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";
import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";
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
const goLeft = () => {
  // if already at the beginning, go to the end
  if (activeIndex.value === 0) {
    activeIndex.value = props.album.Images.length - 1;
  } else {
    activeIndex.value--;
  }
};
const goRight = () => {
  // if already at the end, go to the beginning
  if (activeIndex.value === props.album.Images.length - 1) {
    activeIndex.value = 0;
  } else {
    activeIndex.value++;
  }
};
</script>

<template>
  <div class="overflow-x-auto border">
    <span class="p-1">{{
      `${activeIndex + 1} of ${album.Images.length}`
    }}</span>
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

    <div
      v-else
      class="flex items-center justify-center gap-2"
    >
      <button
        v-if="album.Images.length > 1"
        type="button"
        class="h-36 hover:bg-gray-500 flex items-center justify-center px-2"
        @click="goLeft"
      >
        <LeftArrowIcon class="h-4 w-4" />
      </button>
      <lightgallery
        :settings="{
          speed: 500,
          plugins: plugins,
          licenseKey: lightGalleryLicenseKey,
        }"
        class="mb-4 flex rounded dark:text-white max-h-96 max-w-96"
      >
        <a
          v-for="(image, idx) in album.Images"
          :key="image.id"
          :href="image.url || ''"
          class="flex flex-shrink-0 w-auto"
        >
          <div class="max-h-96 max-w-96">
            <img
              v-if="image"
              :src="image.url || ''"
              :alt="image.alt || ''"
              class="shadow-sm"
              :class="{
                hidden: idx !== activeIndex,
              }"
            >
            <span
              class="text-center"
              :class="{
                hidden: idx !== activeIndex,
              }"
            >
              {{ image.alt }}
            </span>
          </div>
        </a>
      </lightgallery>
      <button
        v-if="album.Images.length > 1"
        class="h-36 hover:bg-gray-500 flex items-center justify-center px-2"
        type="button"
        @click="goRight"
      >
        <RightArrowIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>


<style scoped>
img {
  cursor: pointer;
}
</style>
