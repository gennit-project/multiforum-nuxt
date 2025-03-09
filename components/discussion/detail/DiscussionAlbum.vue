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
    
    <!-- Custom lightbox with split layout -->
    <div v-if="isLightboxOpen" class="custom-lightbox-container" :class="{'flex-column': mdAndDown}">
      <!-- Left panel for images (75% width on desktop, full width on mobile) -->
      <div class="lightbox-image-panel" :class="{'full-width': mdAndDown}">
        <div class="lightbox-header">
          <button class="close-button" @click="closeLightbox">×</button>
          <span class="image-counter">{{ `${lightboxIndex + 1} of ${album.Images.length}` }}</span>
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
          />
          
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
      <div class="content-panel" :class="{'lightbox-content-panel': !mdAndDown, 'lightbox-bottom-panel': mdAndDown}">
        <div class="content-panel-inner">
          <!-- This is where you can put your custom Vue components -->
          <h3 class="panel-title">{{ currentImage.caption || 'Image Details' }}</h3>
          
          <!-- Demo custom component - replace with your own -->
          <div class="custom-panel-content">
            <p>This is a fully customizable Vue panel where you can put any components you want!</p>
            
            <!-- Example interactive elements -->
            <div class="interactive-demo mt-4">
              <button 
                class="interactive-button" 
                @click="likeCount++"
              >
                👍 Like ({{ likeCount }})
              </button>
              
              <div class="comment-input mt-4">
                <input 
                  v-model="commentText" 
                  placeholder="Add a comment..." 
                  class="comment-field"
                />
                <button 
                  class="submit-button" 
                  :disabled="!commentText.trim()" 
                  @click="addComment"
                >
                  Send
                </button>
              </div>
              
              <div class="comments-section mt-4">
                <div v-if="comments.length === 0" class="no-comments">
                  No comments yet
                </div>
                <div v-else class="comments-list">
                  <div v-for="(comment, idx) in comments" :key="idx" class="comment-item">
                    <strong>User:</strong> {{ comment }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (isLightboxOpen.value) {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
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
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  flex-direction: row;
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
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 30px;
  cursor: pointer;
}

.image-counter {
  font-size: 14px;
}

.lightbox-image-panel {
  width: 75%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.lightbox-image-panel.full-width {
  width: 100%;
  height: 60%; /* Take 60% of height when in column layout */
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
  z-index: 1;
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
}

/* Panel styles for mobile/tablet (bottom) */
.lightbox-bottom-panel {
  width: 100%;
  height: 40%;
  background-color: #1e1e1e;
  color: white;
  overflow-y: auto;
}

.content-panel-inner {
  padding: 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.custom-panel-content {
  margin-top: 10px;
  font-size: 14px;
}

/* Example interactive elements styling */
.interactive-demo {
  width: 100%;
}

.interactive-button {
  background-color: #3b5998;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.comment-input {
  display: flex;
  gap: 8px;
}

.comment-field {
  flex: 1;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #3b5998;
  background-color: #242424;
  color: white;
}

.submit-button {
  background-color: #3b5998;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #666;
  cursor: not-allowed;
}

.comments-section {
  margin-top: 15px;
}

.no-comments {
  color: #888;
  font-style: italic;
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>