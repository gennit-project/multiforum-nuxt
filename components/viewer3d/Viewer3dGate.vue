<template>
  <div v-if="activated" class="viewer-3d-gate-active contents">
    <slot />
  </div>
  <button
    v-else
    type="button"
    class="viewer-3d-gate-poster flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-400 bg-gray-100 p-4 text-sm font-medium text-gray-800 hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
    :style="posterStyle"
    :aria-label="ariaLabel"
    data-testid="load-3d-viewer"
    @click.stop="activate"
  >
    <svg
      aria-hidden="true"
      class="h-8 w-8"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
    <span v-if="!compact">Load 3D model</span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CSSProperties } from 'vue';

/**
 * Defers the optional 3D runtime (three.js / @google/model-viewer) until the
 * visitor asks for it. Until then a lightweight, keyboard-accessible poster
 * button holds the viewer's space, so merely rendering an album that contains
 * a GLB/STL file does not download the viewer chunks.
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    height?: string;
    maxWidth?: string;
    aspectRatio?: string;
    compact?: boolean;
  }>(),
  {
    label: '3D model',
    height: '256px',
    maxWidth: '100%',
    aspectRatio: undefined,
    compact: false,
  }
);

const emit = defineEmits<{ activate: [] }>();

const activated = ref(false);

const ariaLabel = computed(() => `Load interactive 3D model: ${props.label}`);

const posterStyle = computed((): CSSProperties => ({
  height: props.height,
  maxWidth: props.maxWidth,
  aspectRatio: props.aspectRatio,
}));

function activate() {
  activated.value = true;
  emit('activate');
}
</script>
