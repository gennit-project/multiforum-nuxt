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
          <div class="header-left">
            <button class="close-button" @click="closeLightbox">×</button>
          </div>
          <div class="header-center">
            <span class="image-counter">{{ `${lightboxIndex + 1} of ${album.Images.length}` }}</span>
          </div>
          <div class="header-right">
            <button class="action-button" @click="toggleFullscreen" title="Toggle fullscreen">
              <span v-if="isFullscreen">⊟</span>
              <span v-else>⊞</span>
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
const isFullscreen = ref(false);

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

// Toggle fullscreen mode
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    const container = document.querySelector('.custom-lightbox-container');
    if (container && container.requestFullscreen) {
      container.requestFullscreen()
        .then(() => {
          isFullscreen.value = true;
        })
        .catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
        .then(() => {
          isFullscreen.value = false;
        })
        .catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
    }
  }
};

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (isLightboxOpen.value) {
    if (e.key === 'Escape') {
      if (isFullscreen.value) {
        document.exitFullscreen()
          .then(() => {
            isFullscreen.value = false;
          })
          .catch(() => {});
      } else {
        closeLightbox();
      }
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'f') {
      toggleFullscreen();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  
  // Listen for fullscreen change events
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('fullscreenchange', () => {});
  document.body.style.overflow = ''; // Ensure scrolling is restored
  
  // Ensure we exit fullscreen if component is unmounted while in fullscreen
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
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
  overflow: hidden;
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
}

.lightbox-image-panel.full-width {
  width: 100%;
  /* Don't constrain the height on small screens - let it take natural height */
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

.lightbox-content-panel {
  width: 25%;
  height: 100%;
  background-color: #1e1e1e;
  color: white;
  overflow-y: auto;
  z-index: 10000;
}

.lightbox-bottom-panel {
  width: 100%;
  height: 15%;
  min-height: 100px; /* Ensure minimum height */
  background-color: #1e1e1e;
  color: white;
  overflow-y: auto;
  z-index: 10002; /* Ensure the bottom panel appears above the image */
  position: absolute;
  bottom: 0;
  left: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5); /* Add shadow for visual separation */
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