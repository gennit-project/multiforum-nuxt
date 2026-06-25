<script lang="ts" setup>
import { computed } from 'vue';
import Identicon from 'identicon.js';
import sha256 from 'crypto-js/sha256';

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  isSquare: {
    type: Boolean,
    required: false,
    default: false,
  },
  src: {
    type: String,
    required: false,
    default: '',
  },
  isLarge: {
    type: Boolean,
    required: false,
    default: false,
  },
  isMedium: {
    type: Boolean,
    required: false,
    default: false,
  },
  isSmall: {
    type: Boolean,
    required: false,
    default: false,
  },
  isDecorative: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// Generate the identicon with a TRANSPARENT background. The themed background
// is applied via CSS (bg-white / dark:bg-black) on the <img> below, driven by
// the `dark` class on <html>. This keeps the generated SVG identical on the
// server and client (no hydration mismatch) and guarantees the avatar always
// matches the visible theme — both on first load and when the user toggles —
// without depending on any JS theme state.
const identiconData = computed(() => {
  const hash = sha256(props.text).toString();

  const data = new Identicon(hash, {
    background: [0, 0, 0, 0],
    margin: 0.2,
    size: 420,
    format: 'svg',
  }).toString();

  return 'data:image/svg+xml;base64,' + data;
});
</script>

<template>
  <div>
    <img
      v-if="src"
      :src="src"
      :alt="isDecorative ? '' : text"
      :aria-hidden="isDecorative ? 'true' : undefined"
      :class="[
        isLarge ? 'h-48 w-48' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
    >
    <img
      v-else
      class="border bg-white dark:border-gray-600 dark:bg-black"
      :class="[
        isLarge ? 'h-48 w-48' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
      :src="identiconData"
      :alt="isDecorative ? '' : text"
      :aria-hidden="isDecorative ? 'true' : undefined"
    >
  </div>
</template>
