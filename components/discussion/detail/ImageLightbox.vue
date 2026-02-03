<script lang="ts" setup>
import type { PropType } from 'vue';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useImageZoom } from '@/composables/useImageZoom';
import LightboxControls from '@/components/discussion/detail/LightboxControls.vue';
import LightboxImagePanel from '@/components/discussion/detail/LightboxImagePanel.vue';
import LightboxInfoPanel from '@/components/discussion/detail/LightboxInfoPanel.vue';
import { useMutation } from '@vue/apollo-composable';
import { UPDATE_IMAGE } from '@/graphQLData/discussion/mutations';

const props = defineProps({
  orderedImages: {
    type: Array as PropType<any[]>,
    required: true,
  },
  initialIndex: {
    type: Number,
    default: 0,
  },
  isLoggedInAuthor: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['close', 'album-updated']);

// Lightbox state
const lightboxIndex = ref(props.initialIndex);
const isPanelVisible = ref(true);
const panelOnSide = ref(true);

// Current image based on ordered images
const currentImage = computed(() => {
  return props.orderedImages[lightboxIndex.value] || {};
});

// Caption editing
const editingCaptionIndex = ref(-1);
const editingCaption = ref('');

// Mutation to update image caption
const { mutate: updateImage, loading: updateLoading } =
  useMutation(UPDATE_IMAGE);

// Use zoom composable
const {
  zoomLevel,
  isZoomed,
  isDragging,
  translateX,
  translateY,
  startDrag,
  onDrag,
  stopDrag,
  startTouchDrag,
  onTouchDrag,
  resetTranslation,
  zoomIn,
  zoomOut,
  resetZoom,
} = useImageZoom();

const startEditingCaption = (index: number) => {
  editingCaptionIndex.value = index;
  editingCaption.value = props.orderedImages[index]?.caption || '';
};

const cancelEditingCaption = () => {
  editingCaptionIndex.value = -1;
  editingCaption.value = '';
};

const saveCaption = async () => {
  if (editingCaptionIndex.value < 0) return;

  const image = props.orderedImages[editingCaptionIndex.value];
  if (!image) return;

  try {
    await updateImage({
      imageId: image.id,
      caption: editingCaption.value,
    });

    emit('album-updated');
    cancelEditingCaption();
  } catch (error) {
    console.error('Error updating caption:', error);
    alert('Error saving caption. Please try again.');
  }
};

const nextImage = () => {
  if (lightboxIndex.value === props.orderedImages.length - 1) {
    lightboxIndex.value = 0;
  } else {
    lightboxIndex.value++;
  }
  zoomLevel.value = 1;
  resetTranslation();
};

const prevImage = () => {
  if (lightboxIndex.value === 0) {
    lightboxIndex.value = props.orderedImages.length - 1;
  } else {
    lightboxIndex.value--;
  }
  zoomLevel.value = 1;
  resetTranslation();
};

const togglePanel = () => {
  isPanelVisible.value = !isPanelVisible.value;
};

const togglePanelPosition = () => {
  panelOnSide.value = !panelOnSide.value;
};

const closeLightbox = () => {
  zoomLevel.value = 1;
  resetTranslation();
  document.body.style.overflow = '';
  emit('close');
};

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (editingCaptionIndex.value !== -1) {
    return;
  }

  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowRight') {
    nextImage();
  } else if (e.key === 'ArrowLeft') {
    prevImage();
  } else if (e.key === 'i') {
    togglePanel();
  } else if (e.key === '+') {
    zoomIn();
  } else if (e.key === '-') {
    zoomOut();
  } else if (e.key === '0') {
    resetZoom();
  }
};

// Custom event handler for mouseup
const handleMouseUp = (event: MouseEvent) => {
  if (editingCaptionIndex.value !== -1) {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      event.stopPropagation();
      return;
    }
  }

  stopDrag(event);
};

// Handler for touch events
const handleTouchStop = (event: TouchEvent) => {
  stopDrag(event);
};

// Touch swipe handling
const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0];
  if (!touch) return;
  touchStartX.value = touch.clientX;

  if (isZoomed.value) {
    return;
  }

  if (editingCaptionIndex.value !== -1) {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      return;
    }
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  if (isZoomed.value) {
    return;
  }

  if (editingCaptionIndex.value !== -1) {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      return;
    }
  }

  const touch = event.changedTouches[0];
  if (!touch) return;
  touchEndX.value = touch.clientX;
  const swipeDistance = touchEndX.value - touchStartX.value;

  if (Math.abs(swipeDistance) > 50) {
    if (swipeDistance > 0) {
      prevImage();
    } else {
      nextImage();
    }
  }
};

const handleImageMouseDown = (event: MouseEvent) => {
  if (isZoomed.value) {
    startDrag(event);
  }
};

const handleImageTouchStart = (event: TouchEvent) => {
  if (isZoomed.value) {
    startTouchDrag(event);
  } else {
    handleTouchStart(event);
  }
};

const handleImageTouchEnd = (event: TouchEvent) => {
  if (isZoomed.value) {
    return;
  }
  handleTouchEnd(event);
};

const handleImageTouchMove = (event: TouchEvent) => {
  if (isZoomed.value) {
    onTouchDrag(event);
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('mouseleave', stopDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('touchend', handleTouchStop);
  window.addEventListener('touchcancel', handleTouchStop);
  document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('mouseleave', stopDrag);
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('touchend', handleTouchStop);
  window.removeEventListener('touchcancel', handleTouchStop);
  document.body.style.overflow = '';
});
</script>

<template>
  <div
    class="fixed left-0 top-0 z-[1000] flex h-full w-full bg-black transition-all duration-300 ease-in-out"
    role="dialog"
    aria-modal="true"
    aria-label="Image lightbox"
    :class="{
      'flex-col': panelOnSide && isPanelVisible,
      'flex-row': !panelOnSide && isPanelVisible,
    }"
  >
    <!-- Image panel -->
    <div
      class="relative z-40 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
      role="region"
      aria-label="Image viewer"
      :class="{
        'h-full w-3/4': !panelOnSide && isPanelVisible,
        'h-full w-full':
          (!panelOnSide && !isPanelVisible) || (panelOnSide && !isPanelVisible),
        'w-full flex-1': panelOnSide && isPanelVisible,
      }"
    >
      <LightboxControls
        :lightbox-index="lightboxIndex"
        :total-images="orderedImages.length"
        :zoom-level="zoomLevel"
        :is-zoomed="isZoomed"
        :is-panel-visible="isPanelVisible"
        :panel-on-side="panelOnSide"
        :current-image-url="currentImage.url || ''"
        :current-image-id="currentImage.id || ''"
        :current-image-caption="currentImage.caption || ''"
        :current-image-alt="currentImage.alt || ''"
        :current-image-uploader="currentImage.Uploader?.username || ''"
        :is-stl-file="currentImage.isStlFile || false"
        @close="closeLightbox"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @reset-zoom="resetZoom"
        @toggle-panel="togglePanel"
        @toggle-panel-position="togglePanelPosition"
      />

      <LightboxImagePanel
        :current-image="currentImage"
        :show-navigation="orderedImages.length > 1"
        :zoom-level="zoomLevel"
        :translate-x="translateX"
        :translate-y="translateY"
        :is-zoomed="isZoomed"
        :is-dragging="isDragging"
        :editing-caption="editingCaptionIndex !== -1"
        @prev-image="prevImage"
        @next-image="nextImage"
        @mousedown="handleImageMouseDown"
        @touchstart="handleImageTouchStart"
        @touchend="handleImageTouchEnd"
        @touchmove="handleImageTouchMove"
      />
    </div>

    <!-- Info panel -->
    <div
      v-if="isPanelVisible"
      class="z-40 overflow-y-auto bg-gray-900 text-white transition-all duration-300 ease-in-out"
      role="complementary"
      aria-label="Image details"
      :class="{
        'h-full w-1/4': !panelOnSide,
        'max-h-[30vh] w-full': panelOnSide,
      }"
    >
      <LightboxInfoPanel
        :current-image="currentImage"
        :is-editing="editingCaptionIndex === lightboxIndex"
        :editing-caption="editingCaption"
        :is-logged-in-author="isLoggedInAuthor"
        :update-loading="updateLoading"
        :panel-on-side="panelOnSide"
        @close-panel="togglePanel"
        @start-editing="startEditingCaption(lightboxIndex)"
        @update-caption="(text) => (editingCaption = text)"
        @save-caption="saveCaption"
        @cancel-editing="cancelEditingCaption"
      />
    </div>
  </div>
</template>
