<script lang="ts" setup>
import DownloadIcon from '@/components/icons/DownloadIcon.vue';
import SwitchHorizontalIcon from '@/components/icons/SwitchHorizontalIcon.vue';
import RefreshIcon from '@/components/icons/RefreshIcon.vue';
import AddImageToFavorites from '@/components/favorites/AddImageToFavorites.vue';

defineProps({
  lightboxIndex: {
    type: Number,
    required: true,
  },
  totalImages: {
    type: Number,
    required: true,
  },
  zoomLevel: {
    type: Number,
    required: true,
  },
  isZoomed: {
    type: Boolean,
    required: true,
  },
  isPanelVisible: {
    type: Boolean,
    required: true,
  },
  panelOnSide: {
    type: Boolean,
    required: true,
  },
  currentImageUrl: {
    type: String,
    default: '',
  },
  currentImageId: {
    type: String,
    default: '',
  },
  currentImageCaption: {
    type: String,
    default: '',
  },
  currentImageAlt: {
    type: String,
    default: '',
  },
  currentImageUploader: {
    type: String,
    default: '',
  },
  isStlFile: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'close',
  'zoom-in',
  'zoom-out',
  'reset-zoom',
  'toggle-panel',
  'toggle-panel-position',
  'download-image',
]);

const downloadImage = (imageUrl: string) => {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => {
      // Create blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      const filename = imageUrl.split('/').pop() || 'image.jpg';
      downloadLink.download = filename;

      // Append to document, click, and clean up
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Release the blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
    })
    .catch((error) => {
      console.error('Download failed:', error);
    });
};
</script>

<template>
  <div
    class="z-50 flex min-w-0 items-center justify-between overflow-visible p-2 text-white"
    :class="{ 'px-3': panelOnSide, 'px-5': !panelOnSide }"
  >
    <div
      class="flex items-center"
      :class="{ 'gap-2': panelOnSide, 'gap-4': !panelOnSide }"
    >
      <button
        class="bg-transparent cursor-pointer border-0 text-white"
        :class="{ 'text-2xl': panelOnSide, 'text-3xl': !panelOnSide }"
        aria-label="Close lightbox"
        @click="emit('close')"
      >
        ×
      </button>
      <div class="flex-1">
        <span :class="{ 'text-xs': panelOnSide, 'text-sm': !panelOnSide }">{{
          `${lightboxIndex + 1} of ${totalImages}`
        }}</span>
      </div>
    </div>

    <div
      class="flex flex-nowrap items-center overflow-visible"
      :class="{ 'gap-1': panelOnSide, 'gap-4': !panelOnSide }"
    >
      <!-- Zoom controls -->
      <div class="flex flex-shrink-0 items-center rounded bg-opacity-10">
        <button
          class="cursor-pointer text-white transition-colors hover:bg-opacity-20"
          :class="[
            {
              'px-1 py-1 text-sm': panelOnSide,
              'px-2 py-1': !panelOnSide,
            },
            { 'cursor-not-allowed opacity-50': zoomLevel <= 1 },
          ]"
          title="Zoom out"
          aria-label="Zoom out"
          :disabled="zoomLevel <= 1"
          @click="emit('zoom-out')"
        >
          −
        </button>
        <span
          class="text-white"
          :class="{
            'px-1 text-xs': panelOnSide,
            'px-2 text-sm': !panelOnSide,
          }"
          >{{ Math.round(zoomLevel * 100) + '%' }}</span
        >
        <button
          class="cursor-pointer text-white transition-colors hover:bg-opacity-20"
          :class="[
            {
              'px-1 py-1 text-sm': panelOnSide,
              'px-2 py-1': !panelOnSide,
            },
            { 'cursor-not-allowed opacity-50': zoomLevel >= 3 },
          ]"
          title="Zoom in"
          aria-label="Zoom in"
          :disabled="zoomLevel >= 3"
          @click="emit('zoom-in')"
        >
          +
        </button>
        <button
          v-if="isZoomed"
          class="flex cursor-pointer items-center justify-center text-white transition-colors hover:bg-opacity-20"
          :class="{
            'h-5 w-5': panelOnSide,
            'h-6 w-6': !panelOnSide,
          }"
          title="Reset zoom"
          aria-label="Reset zoom"
          @click="emit('reset-zoom')"
        >
          <RefreshIcon
            :class="{
              'h-3 w-3': panelOnSide,
              'h-4 w-4': !panelOnSide,
            }"
          />
        </button>
      </div>

      <!-- Panel toggle button -->
      <button
        class="cursor-pointer rounded border-0 bg-gray-800 bg-opacity-10 text-white transition-colors"
        :class="{
          'px-1 py-1 text-xs': panelOnSide,
          'px-2 py-1 text-sm': !panelOnSide,
        }"
        :title="isPanelVisible ? 'Hide panel' : 'Show panel'"
        :aria-label="isPanelVisible ? 'Hide panel' : 'Show panel'"
        @click="emit('toggle-panel')"
      >
        <span v-if="isPanelVisible">{{
          panelOnSide ? 'Hide' : 'Close panel'
        }}</span>
        <span v-else>{{ panelOnSide ? 'Show' : 'Open panel' }}</span>
      </button>
      <!-- More Details button - hidden on narrow screens to save space -->
      <NuxtLink
        v-if="currentImageUploader && !panelOnSide"
        :to="`/u/${currentImageUploader}/images/${currentImageId}`"
        class="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        More Details
      </NuxtLink>
      <!-- Panel position toggle button -->
      <button
        type="button"
        class="flex cursor-pointer items-center justify-center rounded text-xl text-white no-underline hover:bg-white hover:bg-opacity-20"
        :class="{ 'h-6 w-6': panelOnSide, 'h-8 w-8': !panelOnSide }"
        :title="panelOnSide ? 'Move panel to side' : 'Move panel to bottom'"
        :aria-label="panelOnSide ? 'Move panel to side' : 'Move panel to bottom'"
        @click="emit('toggle-panel-position')"
      >
        <SwitchHorizontalIcon
          :class="{ 'h-4 w-4': panelOnSide, 'h-6 w-6': !panelOnSide }"
        />
      </button>
      <!-- Download button -->
      <button
        type="button"
        class="flex cursor-pointer items-center justify-center rounded text-xl text-white no-underline hover:bg-white hover:bg-opacity-20"
        :class="{ 'h-6 w-6': panelOnSide, 'h-8 w-8': !panelOnSide }"
        :href="currentImageUrl"
        aria-label="Download image"
        @click="() => downloadImage(currentImageUrl)"
      >
        <DownloadIcon
          :class="{ 'h-4 w-4': panelOnSide, 'h-6 w-6': !panelOnSide }"
        />
      </button>
      <!-- Add to Favorites button -->
      <AddImageToFavorites
        v-if="currentImageId && !isStlFile"
        :image-id="currentImageId"
        :image-title="currentImageCaption || currentImageAlt || 'Image'"
        :size="panelOnSide ? 'small' : 'medium'"
      />
    </div>
  </div>
</template>
