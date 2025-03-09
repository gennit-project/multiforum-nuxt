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

// Configure lightgallery settings to show captions on the right side
const lightgallerySettings = {
  speed: 500,
  plugins: plugins.value,
  licenseKey: lightGalleryLicenseKey,
  // Place captions outside the slide container
  appendSubHtmlTo: '.lg-outer',
  // Add our custom class for the right-side caption layout
  addClass: 'lg-right-caption',
  // Make sure caption container is created
  subHtmlSelectorRelative: false
};
</script>

<template>
  <div class="overflow-x-auto border">
    <span class="p-1">{{ `${activeIndex + 1} of ${album.Images.length}` }}</span>
    <lightgallery
      v-if="!carouselFormat"
      :settings="lightgallerySettings"
      class="grid grid-cols-3 gap-2 dark:text-white"
    >
      <a
        v-for="image in album.Images"
        :key="image.id"
        :href="image.url || ''"
        :data-sub-html="image.caption ? `<div class='lg-caption-content'>${image.caption}</div>` : ''"
      >
        <img
          v-if="image"
          :src="image.url || ''"
          :alt="image.alt || ''"
          class="shadow-sm"
        >
      </a>
    </lightgallery>
    <div v-else class="flex items-center justify-center gap-2">
      <button
        v-if="album.Images.length > 1"
        type="button"
        class="h-36 hover:bg-gray-500 flex items-center justify-center px-2"
        @click="goLeft"
      >
        <LeftArrowIcon class="h-4 w-4" />
      </button>
      <lightgallery
        :settings="lightgallerySettings"
        class="mb-4 flex rounded dark:text-white max-h-96 max-w-96"
      >
        <a
          v-for="(image, idx) in album.Images"
          :key="image.id"
          :href="image.url || ''"
          :data-sub-html="image.caption ? `<div class='lg-caption-content'>${image.caption}</div>` : ''"
          class="flex flex-shrink-0 w-auto"
        >
          <div class="max-h-96 max-w-96 min-h-10">
            <img
              v-if="image"
              :src="image.url || ''"
              :alt="image.alt || ''"
              class="shadow-sm max-h-96 max-w-96"
              :class="{ hidden: idx !== activeIndex }"
            >
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

<style>
img {
  cursor: pointer;
}

/* Right-side caption layout */
.lg-right-caption {
  /* Add position relative to lg-outer to enable absolute positioning */
  &.lg-outer {
    position: relative;
  }

  /* Set up the layout - main content takes 75% width */
  & .lg-inner {
    width: 75%;
  }

  /* Position and style the caption panel on the right */
  & .lg-sub-html {
    position: absolute;
    top: 0;
    right: 0;
    width: 25%;
    height: 100%;
    padding: 20px;
    margin-top: 40px;
    margin-right: 60px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    text-align: left;
    display: flex;
    justify-content: flex-start;
    font-size: 16px;
    line-height: 1.5;
    overflow-y: auto;
    bottom: auto; /* Override default bottom positioning */
    max-height: none; /* Override default max-height */
  }

  /* Style the caption content */
  & .lg-caption-content {
    max-width: 100%;
    overflow-wrap: break-word;
  }
}
</style>