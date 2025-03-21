<script lang="ts" setup>
import type { PropType } from "vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";
import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";
import type { Album, Image } from "@/__generated__/graphql";
import { useDisplay } from "vuetify";
import DownloadIcon from "@/components/icons/DownloadIcon.vue";

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

// Use Vuetify's display utilities for responsive design
const { mdAndDown } = useDisplay();

// Carousel navigation state
const activeIndex = ref(0);

// Custom lightbox state
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);

const orderedImages = computed(() => {
  // If imageOrder exists and has items, use it to order the images
  if (props.album?.imageOrder && props.album.imageOrder.length > 0) {
    return props.album.imageOrder
      .filter((imageId): imageId is string => !!imageId)
      .map((imageId) => {
        const image = props.album.Images.find((image) => imageId === image.id);
        return image || null;
      })
      .filter((image): image is NonNullable<typeof image> => image !== null);
  }
  // Otherwise, just return all images directly
  else {
    return props.album.Images || [];
  }
});

// Current image based on ordered images
const currentImage = computed(
  () => orderedImages.value[lightboxIndex.value] || {}
);
const isPanelVisible = ref(true);

// Zoom functionality
const zoomLevel = ref(1);
const isZoomed = computed(() => zoomLevel.value > 1);

// Image panning
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const translateX = ref(0);
const translateY = ref(0);

const startDrag = (event: MouseEvent) => {
  if (!isZoomed.value) return;

  // Only start dragging on left mouse button (button 0)
  if (event.button !== 0) return;

  event.preventDefault();
  isDragging.value = true;
  startX.value = event.clientX - translateX.value;
  startY.value = event.clientY - translateY.value;
};

const onDrag = (event: MouseEvent) => {
  // Only move if we're actively dragging (mouse button is held down)
  if (!isDragging.value) return;

  event.preventDefault();
  translateX.value = event.clientX - startX.value;
  translateY.value = event.clientY - startY.value;
};

const stopDrag = () => {
  // Stop dragging when mouse button is released
  isDragging.value = false;
};

// Handle touch events for mobile devices
const startTouchDrag = (event: TouchEvent) => {
  if (!isZoomed.value) return;

  event.preventDefault();
  isDragging.value = true;

  const touch = event.touches[0];
  startX.value = touch.clientX - translateX.value;
  startY.value = touch.clientY - translateY.value;
};

const onTouchDrag = (event: TouchEvent) => {
  if (!isDragging.value) return;

  event.preventDefault();

  const touch = event.touches[0];
  translateX.value = touch.clientX - startX.value;
  translateY.value = touch.clientY - startY.value;
};

// Reset translation when changing images or zoom
const resetTranslation = () => {
  translateX.value = 0;
  translateY.value = 0;
};

// Carousel navigation functions
const goLeft = () => {
  if (activeIndex.value === 0) {
    activeIndex.value = orderedImages.value.length - 1;
  } else {
    activeIndex.value--;
  }
};

const goRight = () => {
  if (activeIndex.value === orderedImages.value.length - 1) {
    activeIndex.value = 0;
  } else {
    activeIndex.value++;
  }
};

// Lightbox functions
const openLightbox = (index: number) => {
  lightboxIndex.value = index;
  isLightboxOpen.value = true;
  isPanelVisible.value = true; // Always show panel when opening lightbox
  zoomLevel.value = 1; // Reset zoom when opening lightbox
  resetTranslation(); // Reset position when opening lightbox
  document.body.style.overflow = "hidden"; // Prevent scrolling
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
  zoomLevel.value = 1; // Reset zoom when closing
  resetTranslation(); // Reset position when closing
  document.body.style.overflow = ""; // Restore scrolling
};

const nextImage = () => {
  if (lightboxIndex.value === orderedImages.value.length - 1) {
    lightboxIndex.value = 0;
  } else {
    lightboxIndex.value++;
  }
  zoomLevel.value = 1; // Reset zoom when changing images
  resetTranslation(); // Reset position when changing images
};

const prevImage = () => {
  if (lightboxIndex.value === 0) {
    lightboxIndex.value = orderedImages.value.length - 1;
  } else {
    lightboxIndex.value--;
  }
  zoomLevel.value = 1; // Reset zoom when changing images
  resetTranslation(); // Reset position when changing images
};

// Toggle panel visibility
const togglePanel = () => {
  isPanelVisible.value = !isPanelVisible.value;
};

// Zoom functions
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value += 0.5;
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 1) {
    zoomLevel.value -= 0.5;
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  resetTranslation();
};

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (isLightboxOpen.value) {
    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowRight") {
      nextImage();
    } else if (e.key === "ArrowLeft") {
      prevImage();
    } else if (e.key === "i") {
      // 'i' for info panel toggle
      togglePanel();
    } else if (e.key === "+") {
      zoomIn();
    } else if (e.key === "-") {
      zoomOut();
    } else if (e.key === "0") {
      resetZoom();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);

  // Global event listeners to handle events outside the image element
  window.addEventListener("mouseup", stopDrag);
  window.addEventListener("mouseleave", stopDrag); // Stop dragging if mouse leaves window
  window.addEventListener("mousemove", onDrag);

  // Touch events for mobile
  window.addEventListener("touchend", stopDrag);
  window.addEventListener("touchcancel", stopDrag);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("mouseup", stopDrag);
  window.removeEventListener("mouseleave", stopDrag);
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("touchend", stopDrag);
  window.removeEventListener("touchcancel", stopDrag);
  document.body.style.overflow = ""; // Ensure scrolling is restored
});

const downloadImage = (imageUrl: string) => {
  fetch(imageUrl)
    .then((response) => response.blob())
    .then((blob) => {
      // Create blob URL
      const blobUrl = URL.createObjectURL(blob);

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      const filename = imageUrl.split("/").pop() || "image.jpg";
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
      console.error("Download failed:", error);
    });
};

const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (event: TouchEvent) => {
  touchStartX.value = event.touches[0].clientX;
};

const handleTouchEnd = (event: TouchEvent) => {
  touchEndX.value = event.changedTouches[0].clientX;
  const swipeDistance = touchEndX.value - touchStartX.value;
  
  // Only trigger if the swipe is significant enough (e.g., > 50px)
  if (Math.abs(swipeDistance) > 50) {
    if (swipeDistance > 0) {
      // Swiped right
      goLeft();
    } else {
      // Swiped left
      goRight();
    }
  }
};
</script>

<template>
  <div class="w-full h-full">
    <!-- Normal thumbnail grid view -->
    <div v-if="!isLightboxOpen" class="overflow-x-auto border">

      <!-- Grid view -->
      <div
        v-if="!carouselFormat"
        class="grid grid-cols-3 gap-2 dark:text-white"
      >
        <div
          v-for="(image, idx) in orderedImages"
          :key="image.id"
          class="cursor-pointer"
          @click="openLightbox(idx)"
        >
          <img
            v-if="image"
            :src="image.url || ''"
            :alt="image.alt || ''"
            class="shadow-sm"
          >
          <span class="text-center">
            {{ image.caption }}
          </span>
        </div>
      </div>

      <!-- Carousel view -->
      <div v-else class="flex flex-col">
        <!-- Counter and navigation row -->
        <div class="flex items-center justify-between p-2">
          <span class="text-sm">{{
            `${activeIndex + 1} of ${orderedImages.length}`
          }}</span>

          <div v-if="orderedImages.length > 1" class="flex gap-2">
            <button
              type="button"
              class="hover:bg-gray-500 flex items-center justify-center px-2 h-8"
              @click="goLeft"
            >
              <LeftArrowIcon class="h-4 w-4" />
            </button>

            <button
              class="hover:bg-gray-500 flex items-center justify-center px-2 h-8"
              type="button"
              @click="goRight"
            >
              <RightArrowIcon class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Image container -->
        <div class="flex items-center justify-center">
          <div 
            class="mb-4 flex rounded dark:text-white max-h-96 max-w-96"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
          >
            <div
              v-for="(image, idx) in orderedImages"
              :key="image.id"
              class="flex flex-shrink-0 w-auto"
            >
              <div
                class="max-h-96 max-w-96 min-h-10 cursor-pointer"
                @click="openLightbox(idx)"
              >
                <img
                  v-if="image"
                  :src="image.url || ''"
                  :alt="image.alt || ''"
                  class="shadow-sm max-h-96 max-w-96"
                  :class="{ hidden: idx !== activeIndex }"
                >
                <span
                  class="text-center"
                  :class="{ hidden: idx !== activeIndex }"
                >
                  {{ image.caption }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom lightbox with split layout -->
    <div
      v-if="isLightboxOpen"
      class="fixed top-0 left-0 w-full h-full bg-black z-50 transition-all duration-300 ease-in-out"
      :class="{
        'flex-col': mdAndDown,
        flex: true,
      }"
    >
      <!-- Left panel for images (75% width on desktop, full width on mobile) -->
      <div
        class="flex flex-col relative transition-all duration-300 ease-in-out z-40 overflow-hidden"
        :class="{
          'w-3/4 h-full': !mdAndDown && isPanelVisible,
          'w-full h-full': mdAndDown || !isPanelVisible,
        }"
      >
        <div class="flex justify-between items-center p-2 px-5 text-white z-50">
          <div class="flex items-center gap-4">
            <button
              class="bg-transparent border-0 text-white text-3xl cursor-pointer"
              @click="closeLightbox"
            >
              ×
            </button>
            <div class="flex-1">
              <span class="text-sm">{{
                `${lightboxIndex + 1} of ${orderedImages.length}`
              }}</span>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <!-- Zoom controls -->
            <div class="flex items-center bg-opacity-10 rounded">
              <button
                class="px-2 py-1 hover:bg-opacity-20 text-white cursor-pointer transition-colors"
                title="Zoom out"
                @click="zoomOut"
                :disabled="zoomLevel <= 1"
                :class="{ 'opacity-50 cursor-not-allowed': zoomLevel <= 1 }"
              >
                −
              </button>
              <span class="px-2 text-sm text-white"
                >{{ Math.round(zoomLevel * 100) }}%</span
              >
              <button
                class="px-2 py-1 hover:bg-opacity-20 text-white cursor-pointer transition-colors"
                title="Zoom in"
                @click="zoomIn"
                :disabled="zoomLevel >= 3"
                :class="{ 'opacity-50 cursor-not-allowed': zoomLevel >= 3 }"
              >
                +
              </button>
              <button
                v-if="isZoomed"
                class="px-2 py-1 hover:bg-opacity-20 text-white cursor-pointer transition-colors"
                title="Reset zoom"
                @click="resetZoom"
              >
                Reset
              </button>
            </div>

            <!-- Panel toggle button -->
            <button
              class="bg-opacity-10 bg-gray-800 border-0 text-white py-1 px-2 rounded cursor-pointer text-sm transition-colors"
              @click="togglePanel"
              :title="isPanelVisible ? 'Hide panel' : 'Show panel'"
            >
              <span v-if="isPanelVisible">Close panel</span>
              <span v-else>Open panel</span>
            </button>
            <button
              type="button"
              class="flex items-center justify-center w-8 h-8 rounded hover:bg-white hover:bg-opacity-20 text-white text-xl no-underline cursor-pointer"
              :href="currentImage.url || ''"
              @click="() => downloadImage(currentImage.url || '')"
            >
              <DownloadIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <div
          class="flex-1 flex justify-center items-center relative h-full overflow-hidden"
        >
          <button
            v-if="orderedImages.length > 1"
            class="absolute left-5 bg-black bg-opacity-50 text-white border-0 w-10 h-10 rounded-full flex justify-center items-center cursor-pointer z-50"
            @click="prevImage"
          >
            <LeftArrowIcon class="h-6 w-6" />
          </button>

          <img
            :src="currentImage.url || ''"
            :alt="currentImage.alt || ''"
            class="object-contain transition-all duration-300 ease-in-out"
            :style="{
              transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
            }"
            :class="{
              'max-h-[90%] max-w-[90%]': isPanelVisible && !isZoomed,
              'max-h-[95%] max-w-[95%]': !isPanelVisible && !isZoomed,
            }"
            @mousedown="startDrag"
            @touchstart="startTouchDrag"
            @touchmove="onTouchDrag"
          />

          <button
            v-if="orderedImages.length > 1"
            class="absolute right-5 bg-black bg-opacity-50 text-white border-0 w-10 h-10 rounded-full flex justify-center items-center cursor-pointer z-50"
            @click="nextImage"
          >
            <RightArrowIcon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Right/Bottom panel for custom content (different layouts based on screen size) -->
      <div
        v-if="isPanelVisible"
        class="bg-gray-900 text-white overflow-y-auto z-40 transition-all duration-300 ease-in-out"
        :class="{
          'w-1/4 h-full': !mdAndDown,
          'w-full h-22 min-h-[70px] absolute bottom-0 left-0 shadow-md shadow-black':
            mdAndDown,
        }"
      >
        <div class="p-5">
          <div
            v-if="currentImage.caption"
            class="text-md mb-4 pb-2 border-white border-opacity-20"
          >
            {{ currentImage.caption || "Image Details" }}
          </div>
          <div v-else class="text-gray-400 italic mt-2">
            No caption available for this image.
          </div>
          <!-- <MarkdownPreview
            v-if="currentImage.caption"
            :text="currentImage.caption"
          /> -->
        </div>
      </div>
    </div>
  </div>
</template>
