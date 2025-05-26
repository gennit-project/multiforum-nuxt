<template>
  <div class="model-viewer-container relative border">
    <!-- Fullscreen button -->
    <button
      class="absolute right-2 top-2 z-10 rounded-md bg-black bg-opacity-50 p-2 text-white transition-all duration-200 hover:bg-opacity-70"
      title="View in fullscreen"
      @click="openFullscreen"
    >
      <svg
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
      v-if="modelUrl"
      :src="modelUrl"
      alt="3D Model Preview"
      auto-rotate
      camera-controls
      exposure="0.8"
      shadow-intensity="0.4"
      environment-image="https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr"
      tone-mapping="neutral"
      style="width: 100%; height: 300px; border-radius: 8px"
    />

    <!-- Fullscreen modal -->
    <div
      v-if="isFullscreen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      @click="closeFullscreen"
    >
      <!-- Close button -->
      <button
        class="absolute right-4 top-4 z-[100] rounded-md bg-black bg-opacity-50 p-3 text-white transition-all duration-200 hover:bg-opacity-70"
        title="Close fullscreen"
        @click.stop="closeFullscreen"
        @mousedown.stop
        @touchstart.stop
      >
        <svg
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
      <div
        class="h-full max-h-full w-full max-w-6xl"
        @click.stop
      >
        <model-viewer
          :src="
            modelUrl ||
            'https://storage.googleapis.com/listical-dev/models/Tiny_Khopesh_Warrior_Posed_and_Rigged.glb'
          "
          alt="3D Model Preview - Fullscreen"
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
  import { onMounted, onUnmounted, ref } from "vue";

  defineProps<{
    modelUrl?: string;
    height?: string;
    width?: string;
  }>();

  const isFullscreen = ref(false);
  const modelViewer = ref();

  const openFullscreen = () => {
    isFullscreen.value = true;
    // Prevent body scroll when fullscreen is open
    document.body.style.overflow = "hidden";
  };

  const closeFullscreen = () => {
    isFullscreen.value = false;
    // Restore body scroll
    document.body.style.overflow = "";
  };

  onMounted(async () => {
    if (import.meta.client) {
      await import("@google/model-viewer");
    }
  });

  // Close fullscreen on escape key
  onMounted(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen.value) {
        closeFullscreen();
      }
    };

    document.addEventListener("keydown", handleEscape);

    // Cleanup on unmount
    onUnmounted(() => {
      document.removeEventListener("keydown", handleEscape);
      // Ensure body scroll is restored if component unmounts while fullscreen
      if (isFullscreen.value) {
        document.body.style.overflow = "";
      }
    });
  });
</script>
