<script setup lang="ts">
import { computed } from 'vue';
import { hasStlExtension } from '@/utils/fileTypeUtils';

// Static stand-in for a 3D model in thumbnails and grids. Rendering a live
// viewer there downloaded the 3D runtime (hundreds of KB) plus the model file
// and opened a WebGL context per tile, even when the model was not selected.
// The interactive viewer now loads only for the selected item.
const props = withDefaults(
  defineProps<{
    modelUrl: string;
    alt?: string;
    width?: string;
    height?: string;
  }>(),
  {
    alt: '3D model',
    width: '100%',
    height: '100%',
  }
);

const formatLabel = computed(() =>
  hasStlExtension(props.modelUrl) ? 'STL' : 'GLB'
);
</script>

<template>
  <div
    role="img"
    :aria-label="alt"
    class="flex flex-col items-center justify-center gap-1 rounded bg-gray-800 text-gray-100"
    :style="{ width, height }"
    data-testid="model-preview-tile"
  >
    <svg
      aria-hidden="true"
      class="h-1/3 max-h-12 w-1/3 max-w-12"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
    <span aria-hidden="true" class="text-xs font-semibold tracking-wide">
      3D · {{ formatLabel }}
    </span>
  </div>
</template>
