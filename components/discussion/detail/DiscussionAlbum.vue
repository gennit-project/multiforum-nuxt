<script lang="ts" setup>
import type { PropType } from "vue";
import { ref, computed, onMounted, onUnmounted } from "vue";
import LeftArrowIcon from "@/components/icons/LeftArrowIcon.vue";
import RightArrowIcon from "@/components/icons/RightArrowIcon.vue";
import type { Album } from "@/__generated__/graphql";
import { useDisplay } from "vuetify";

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

const { mdAndDown } = useDisplay();

// Carousel navigation state
const activeIndex = ref(0);

const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);
const currentImage = computed(() => props.album.Images[lightboxIndex.value] || {});
const isPanelVisible = ref(true);

const goLeft = () => {
  if (activeIndex.value === 0) {
    activeIndex.value = props.album.Images.length - 1;
  } else {
    activeIndex.value--;
  }
};

const goRight = () => {
  if (activeIndex.value === props.album.Images.length - 1) {
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
  document.body.style.overflow = 'hidden'; // Prevent scrolling
};

const closeLightbox = () => {
  isLightboxOpen.value = false;
  document.body.style.overflow = ''; // Restore scrolling
};

const nextImage = () => {
  if (lightboxIndex.value === props.album.Images.length - 1) {
    lightboxIndex.value = 0;
  } else {
    lightboxIndex.value++;
  }
};

const prevImage = () => {
  if (lightboxIndex.value === 0) {
    lightboxIndex.value = props.album.Images.length - 1;
  } else {
    lightboxIndex.value--;
  }
};

// Toggle panel visibility
const togglePanel = (event: any) => {
  event.preventDefault()
  isPanelVisible.value = !isPanelVisible.value;
};

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (isLightboxOpen.value) {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'i') {
      // 'i' for info panel toggle
      togglePanel();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = ''; // Ensure scrolling is restored
});
</script>

<template>
  <div class="album-container">
    <!-- Normal thumbnail grid view -->
    <div v-if="!isLightboxOpen" class="overflow-x-auto border">
      <span class="p-1">{{ `${activeIndex + 1} of ${album.Images.length}` }}</span>
      
      <!-- Grid view -->
      <div v-if="!carouselFormat" class="grid grid-cols-3 gap-2 dark:text-white">
        <div v-for="(image, idx) in album.Images" :key="image.id" class="cursor-pointer" @click="openLightbox(idx)">
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
      <div v-else class="flex items-center justify-center gap-2">
        <button
          v-if="album.Images.length > 1"
          type="button"
          class="h-36 hover:bg-gray-500 flex items-center justify-center px-2"
          @click="goLeft"
        >
          <LeftArrowIcon class="h-4 w-4" />
        </button>
        
        <div class="mb-4 flex rounded dark:text-white max-h-96 max-w-96">
          <div v-for="(image, idx) in album.Images" :key="image.id" class="flex flex-shrink-0 w-auto">
            <div class="max-h-96 max-w-96 min-h-10 cursor-pointer" @click="openLightbox(idx)">
              <img
                v-if="image"
                :src="image.url || ''"
                :alt="image.alt || ''"
                class="shadow-sm max-h-96 max-w-96"
                :class="{ hidden: idx !== activeIndex }"
              >
              <span class="text-center" :class="{ hidden: idx !== activeIndex }">
                {{ image.caption }}
              </span>
            </div>
          </div>
        </div>
        
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
    <div 
      v-if="isLightboxOpen" 
      class="custom-lightbox-container" 
      :class="{
        'flex-column': mdAndDown,
        'panel-expanded': isPanelVisible,
        'panel-collapsed': !isPanelVisible
      }"
    >
      <!-- Left panel for images (75% width on desktop, full width on mobile) -->
      <div class="lightbox-image-panel" :class="{'full-width': mdAndDown || !isPanelVisible}">
        <div class="lightbox-header">
          <div class="header-left">
            <button class="close-button" @click="closeLightbox">×</button>
          </div>
          <div class="header-center">
            <span class="image-counter">{{ `${lightboxIndex + 1} of ${album.Images.length}` }}</span>
          </div>
          <div class="header-right">
            <!-- Panel toggle button - Show different icons based on state -->
            <button  @click="togglePanel" :title="isPanelVisible ? 'Hide panel' : 'Show panel'">
              <span v-if="isPanelVisible">Close panel</span>
              <span v-else>Open panel</span>
              
            </button>
            <a 
              class="action-button" 
              :href="currentImage.url || ''" 
              download 
              title="Download image"
            >
              ↓
            </a>
          </div>
        </div>
        
        <div class="image-container">
          <button 
            v-if="album.Images.length > 1" 
            class="nav-button prev-button" 
            @click="prevImage"
          >
            <LeftArrowIcon class="h-6 w-6" />
          </button>
          
          <img 
            :src="currentImage.url || ''" 
            :alt="currentImage.alt || ''" 
            class="lightbox-image"
          >
          
          <button 
            v-if="album.Images.length > 1" 
            class="nav-button next-button" 
            @click="nextImage"
          >
            <RightArrowIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <!-- Right/Bottom panel for custom content (different layouts based on screen size) -->
      <div 
        v-if="isPanelVisible" 
        class="content-panel flex" 
        :class="{'lightbox-content-panel': !mdAndDown, 'lightbox-bottom-panel': mdAndDown}"
      >
        <div class="content-panel-inner flex-1">
          <h1 class="text-xl font-bold dark:text-white">{{currentImage.caption}}</h1>
          
          <MarkdownPreview v-if="currentImage.caption" :text="currentImage.caption"/>
          
          <div v-else class="no-caption">
            No caption available for this image.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-container {
  width: 100%;
  height: 100%;
}

/* Custom lightbox styling */
.custom-lightbox-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  z-index: 9999;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Panel visibility transition */
.custom-lightbox-container.panel-collapsed .lightbox-image-panel {
  width: 100%;
  transition: width 0.3s ease;
}

.custom-lightbox-container.panel-expanded .lightbox-image-panel {
  transition: width 0.3s ease;
}

/* When on medium or smaller screens, stack vertically */
.custom-lightbox-container.flex-column {
  flex-direction: column;
}

.lightbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  color: white;
  z-index: 10001; /* Keep header above all elements */
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-center {
  flex: 1;
  text-align: center;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 30px;
  cursor: pointer;
}

.action-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  text-decoration: none;
}

.action-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.image-counter {
  font-size: 14px;
}

.lightbox-image-panel {
  width: 75%;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 10000;
  position: relative;
  transition: width 0.3s ease;
}

.lightbox-image-panel.full-width {
  width: 100%;
  height: auto;
  flex: 1;
}

.image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.lightbox-image {
  max-height: 90%;
  max-width: 90%;
  object-fit: contain;
  transition: max-height 0.3s ease, max-width 0.3s ease;
}

/* Make image larger when panel is collapsed */
.panel-collapsed .lightbox-image {
  max-height: 95%;
  max-width: 95%;
}

.nav-button {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10001; /* Keep nav buttons above all elements */
}

.prev-button {
  left: 20px;
}

.next-button {
  right: 20px;
}

/* Panel styles for desktop (right side) */
.lightbox-content-panel {
  width: 25%;
  height: 100%;
  background-color: #1e1e1e;
  color: white;
  overflow-y: auto;
  z-index: 10000;
  transition: width 0.3s ease;
}

/* Panel styles for mobile/tablet (bottom) */
.lightbox-bottom-panel {
  width: 100%;
  height: 10%;
  min-height: 100px; /* Ensure minimum height */
  background-color: #1e1e1e;
  color: white;
  overflow-y: auto;
  z-index: 10002; /* Ensure the bottom panel appears above the image */
  position: absolute;
  bottom: 0;
  left: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5); /* Add shadow for visual separation */
  transition: height 0.3s ease;
}

.content-panel-inner {
  padding: 20px;
}

.no-caption {
  color: #888;
  font-style: italic;
  margin-top: 10px;
}
</style>