<script lang="ts" setup>
import type { PropType } from 'vue';
import LeftArrowIcon from '@/components/icons/LeftArrowIcon.vue';
import RightArrowIcon from '@/components/icons/RightArrowIcon.vue';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';

const props = defineProps({
  currentImage: {
    type: Object as PropType<any>,
    required: true,
  },
  showNavigation: {
    type: Boolean,
    default: false,
  },
  zoomLevel: {
    type: Number,
    required: true,
  },
  translateX: {
    type: Number,
    required: true,
  },
  translateY: {
    type: Number,
    required: true,
  },
  isZoomed: {
    type: Boolean,
    required: true,
  },
  isDragging: {
    type: Boolean,
    required: true,
  },
  editingCaption: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'prev-image',
  'next-image',
  'mousedown',
  'touchstart',
  'touchend',
  'touchmove',
]);


const handleClick = (event: MouseEvent) => {
  // Don't close editing mode if click happens within editor
  if (props.editingCaption) {
    const target = event.target as HTMLElement;
    if (
      target &&
      (target.tagName === 'TEXTAREA' ||
        target.closest('.text-editor-container') ||
        target.closest('form') ||
        target.closest('button'))
    ) {
      event.stopPropagation();
    }
  }
};
</script>

<template>
  <div
    class="relative flex h-full flex-1 items-center justify-center overflow-hidden"
    @click="handleClick"
  >
    <button
      v-if="showNavigation"
      class="absolute left-5 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black bg-opacity-50 text-white"
      aria-label="Previous image"
      @click="emit('prev-image')"
    >
      <LeftArrowIcon class="h-6 w-6" />
    </button>

    <ModelViewer
      v-if="
        currentImage && currentImage.url && hasGlbExtension(currentImage.url)
      "
      :model-url="currentImage.url"
      height="100%"
      width="100%"
      class="h-full w-full object-contain transition-all duration-300 ease-in-out"
      :style="{
        transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
        cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
      }"
      @mousedown="(e: MouseEvent) => emit('mousedown', e)"
      @touchstart="(e: TouchEvent) => emit('touchstart', e)"
      @touchend="(e: TouchEvent) => emit('touchend', e)"
      @touchmove="(e: TouchEvent) => emit('touchmove', e)"
    />
    <div
      v-else-if="
        currentImage && currentImage.url && hasStlExtension(currentImage.url)
      "
      class="flex h-full w-full items-center justify-center"
      :style="{
        transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
        cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
      }"
      @mousedown="(e: MouseEvent) => emit('mousedown', e)"
      @touchstart="(e: TouchEvent) => emit('touchstart', e)"
      @touchend="(e: TouchEvent) => emit('touchend', e)"
      @touchmove="(e: TouchEvent) => emit('touchmove', e)"
    >
      <ClientOnly>
        <StlViewer
          :src="currentImage.url"
          :width="800"
          :height="600"
          class="object-contain transition-all duration-300 ease-in-out"
        />
      </ClientOnly>
    </div>
    <img
      v-else
      :src="currentImage.url || ''"
      :alt="currentImage.alt || ''"
      class="h-full w-full object-contain transition-all duration-300 ease-in-out"
      :style="{
        transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`,
        cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'auto',
      }"
      @mousedown="(e: MouseEvent) => emit('mousedown', e)"
      @touchstart="(e: TouchEvent) => emit('touchstart', e)"
      @touchend="(e: TouchEvent) => emit('touchend', e)"
      @touchmove="(e: TouchEvent) => emit('touchmove', e)"
    >

    <button
      v-if="showNavigation"
      class="absolute right-5 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black bg-opacity-50 text-white"
      aria-label="Next image"
      @click="emit('next-image')"
    >
      <RightArrowIcon class="h-6 w-6" />
    </button>
  </div>
</template>
