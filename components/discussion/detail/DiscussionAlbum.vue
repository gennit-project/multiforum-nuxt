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

// Custom onAfterOpen handler to apply our caption panel styles after lightgallery opens
const onAfterOpen = () => {
  // This runs after lightgallery opens
  // We'll add our custom CSS classes and move the captions to the right panel
  const lgContainer = document.querySelector('.lg-container');
  if (lgContainer) {
    lgContainer.classList.add('custom-layout');
    
    // Find all caption elements and move them to the right panel
    const captionElements = document.querySelectorAll('.lg-sub-html');
    captionElements.forEach((caption) => {
      const rightPanel = document.querySelector('.lg-caption-panel');
      if (rightPanel && caption.textContent) {
        rightPanel.innerHTML = caption.textContent;
        caption.innerHTML = ''; // Clear the original caption area
      }
    });
  }
};

// Add custom CSS to modify lightgallery's layout
const customLightgallerySettings = {
  speed: 500,
  plugins: plugins.value,
  licenseKey: lightGalleryLicenseKey,
  addClass: 'lg-custom-layout',
  appendSubHtmlTo: '.lg-item',
  onAfterOpen: onAfterOpen,
  // Add custom HTML template to include our right panel
  template: `
    <div class="lg-outer lg-css3">
      <div class="lg-inner">
        <div class="lg-item"></div>
      </div>
      <div class="lg-toolbar"></div>
      <div class="lg-caption-panel"></div>
      <div class="lg-prev"></div>
      <div class="lg-next"></div>
      <div class="lg-counter"></div>
    </div>
  `,
};
</script>

<template>
  <div class="overflow-x-auto border">
    <span class="p-1">{{ `${activeIndex + 1} of ${album.Images.length}` }}</span>
    <lightgallery
      v-if="!carouselFormat"
      :settings="customLightgallerySettings"
      class="grid grid-cols-3 gap-2 dark:text-white"
    >
      <a
        v-for="image in album.Images"
        :key="image.id"
        :href="image.url || ''"
        :data-sub-html="image.caption"
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
        :settings="customLightgallerySettings"
        class="mb-4 flex rounded dark:text-white max-h-96 max-w-96"
      >
        <a
          v-for="(image, idx) in album.Images"
          :key="image.id"
          :href="image.url || ''"
          :data-sub-html="image.caption"
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

/* Custom lightgallery layout with right panel for captions */
.lg-custom-layout .lg-inner {
  width: 75% !important;
  float: left;
}

.lg-custom-layout .lg-caption-panel {
  width: 25%;
  float: right;
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1.5;
  text-align: left;
}

/* Hide original caption area */
.lg-custom-layout .lg-sub-html {
  display: none;
}
</style>