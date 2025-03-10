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

// Use Vuetify's display utilities for responsive design
const { mdAndDown } = useDisplay();

// Carousel navigation state
const activeIndex = ref(0);

// Custom lightbox state
const isLightboxOpen = ref(false);
const lightboxIndex = ref(0);
const currentImage = computed(() => props.album.Images[lightboxIndex.value] || {});
const isPanelVisible = ref(true);

// Example interactive panel state
const likeCount = ref(0);
const commentText = ref('');
const comments = ref<string[]>([]);

// Carousel navigation functions
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

// Example panel interaction function
const addComment = () => {
  if (commentText.value.trim()) {
    comments.value.push(commentText.value);
    commentText.value = '';
  }
};

// Toggle panel visibility
const togglePanel = () => {
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
  <div class="w-full h-full">
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
    
    <!-- Custom lightbox with split layout -->
    <div 
      v-if="isLightboxOpen" 
      class="fixed top-0 left-0 w-full h-full bg-black z-50 transition-all duration-300 ease-in-out"
      :class="{
        'flex-col': mdAndDown,
        'flex': true
      }"
    >
      <!-- Left panel for images (75% width on desktop, full width on mobile) -->
      <div 
        class="flex flex-col relative transition-all duration-300 ease-in-out z-40 overflow-hidden"
        :class="{
          'w-3/4 h-full': !mdAndDown && isPanelVisible,
          'w-full h-full': mdAndDown || !isPanelVisible
        }"
      >
        <div class="flex justify-between items-center p-2 px-5 text-white z-50">
          <div class="flex items-center gap-4">
            <button class="bg-transparent border-0 text-white text-3xl cursor-pointer" @click="closeLightbox">×</button>
          </div>
          <div class="flex-1 text-center">
            <span class="text-sm">{{ `${lightboxIndex + 1} of ${album.Images.length}` }}</span>
          </div>
          <div class="flex items-center gap-4">
            <!-- Panel toggle button -->
            <button 
              class="bg-opacity-10 hover:bg-opacity-20 bg-white border-0 text-white py-1 px-2 rounded cursor-pointer text-sm transition-colors"
              @click="togglePanel" 
              :title="isPanelVisible ? 'Hide panel' : 'Show panel'"
            >
              <span v-if="isPanelVisible">Close panel</span>
              <span v-else>Open panel</span>
            </button>
            <a 
              class="flex items-center justify-center w-8 h-8 rounded hover:bg-white hover:bg-opacity-20 text-white text-xl no-underline cursor-pointer" 
              :href="currentImage.url || ''" 
              download 
              title="Download image"
            >
              ↓
            </a>
          </div>
        </div>
        
        <div class="flex-1 flex justify-center items-center relative h-full">
          <button 
            v-if="album.Images.length > 1" 
            class="absolute left-5 bg-black bg-opacity-50 text-white border-0 w-10 h-10 rounded-full flex justify-center items-center cursor-pointer z-50" 
            @click="prevImage"
          >
            <LeftArrowIcon class="h-6 w-6" />
          </button>
          
          <img 
            :src="currentImage.url || ''" 
            :alt="currentImage.alt || ''" 
            class="object-contain transition-all duration-300 ease-in-out"
            :class="{
              'max-h-[90%] max-w-[90%]': isPanelVisible,
              'max-h-[95%] max-w-[95%]': !isPanelVisible
            }"
          />
          
          <button 
            v-if="album.Images.length > 1" 
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
          'w-full h-24 min-h-[100px] absolute bottom-0 left-0 shadow-md shadow-black': mdAndDown
        }"
      >
        <div class="p-5">
          <h3 class="text-lg font-bold mb-4 pb-2 border-b border-white border-opacity-20">
            {{ currentImage.caption || 'Image Details' }}
          </h3>
          
          <!-- This is where you can put your custom Vue components -->
          <MarkdownPreview v-if="currentImage.caption" :text="currentImage.caption" />
          
          <div v-else class="text-gray-400 italic mt-2">
            No caption available for this image.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>