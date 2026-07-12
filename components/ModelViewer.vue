<template>
  <div
    class="model-viewer-container relative border"
    :class="props.class"
    :style="props.style"
  >
    <!-- Fullscreen button -->
    <button
      v-if="showFullscreenButton !== false"
      ref="fullscreenButtonRef"
      type="button"
      aria-label="View 3D model in fullscreen"
      class="absolute right-2 top-2 z-10 rounded-md bg-black bg-opacity-50 p-2 text-white transition-all duration-200 hover:bg-opacity-70"
      @click="openFullscreen"
    >
      <svg
        aria-hidden="true"
        class="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>
    </button>

    <model-viewer
      v-if="props.modelUrl"
      :src="props.modelUrl"
      :alt="modelAlt"
      auto-rotate
      camera-controls
      exposure="0.8"
      shadow-intensity="0.4"
      environment-image="https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr"
      tone-mapping="neutral"
      :style="{
        width: props.width || '100%',
        height: props.height || '300px',
        borderRadius: '8px',
      }"
    />

    <!-- Fullscreen modal -->
    <div
      v-if="isFullscreen"
      ref="dialogRef"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="dialogTitleId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      @click="closeFullscreen"
    >
      <h2 :id="dialogTitleId" class="sr-only">Fullscreen 3D model viewer</h2>

      <!-- Close button -->
      <button
        type="button"
        aria-label="Close fullscreen 3D model viewer"
        class="absolute right-4 top-4 z-[100] rounded-md bg-black bg-opacity-50 p-3 text-white transition-all duration-200 hover:bg-opacity-70"
        @click.stop="closeFullscreen"
        @mousedown.stop
        @touchstart.stop
      >
        <svg
          aria-hidden="true"
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Fullscreen model viewer -->
      <div class="h-full max-h-full w-full max-w-6xl" @click.stop>
        <model-viewer
          :src="
            props.modelUrl ||
            'https://storage.googleapis.com/listical-dev/models/Tiny_Khopesh_Warrior_Posed_and_Rigged.glb'
          "
          :alt="`${modelAlt} in fullscreen`"
          camera-controls
          style="width: 100%; height: 95%; border-radius: 8px"
          exposure="0.8"
          shadow-intensity="0.4"
          environment-image="https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr"
          tone-mapping="neutral"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { useFocusTrap } from '@/composables/useFocusTrap';

const props = withDefaults(
  defineProps<{
    modelUrl?: string;
    modelAlt?: string;
    height?: string;
    width?: string;
    showFullscreenButton?: boolean;
    class?: string;
    style?: Record<string, string | number>;
  }>(),
  {
    modelUrl: '',
    modelAlt: 'Interactive 3D model',
    height: undefined,
    width: undefined,
    showFullscreenButton: true,
    class: undefined,
    style: undefined,
  }
);

const isFullscreen = ref(false);
const dialogRef = ref<HTMLElement | null>(null);
const fullscreenButtonRef = ref<HTMLButtonElement | null>(null);
const dialogTitleId = useId();
let previousBodyOverflow = '';

const openFullscreen = () => {
  previousBodyOverflow = document.body.style.overflow;
  isFullscreen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeFullscreen = () => {
  isFullscreen.value = false;
  document.body.style.overflow = previousBodyOverflow;
};

useFocusTrap(dialogRef, {
  active: isFullscreen,
  onEscape: closeFullscreen,
  fallbackTrigger: () => fullscreenButtonRef.value,
});

onMounted(async () => {
  if (import.meta.client) {
    await import('@google/model-viewer');
  }
});

onBeforeUnmount(() => {
  if (isFullscreen.value) {
    document.body.style.overflow = previousBodyOverflow;
  }
});
</script>
