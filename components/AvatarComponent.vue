<script lang="ts" setup>
<<<<<<< HEAD
  import { computed } from "vue";
  import Identicon from "identicon.js";
  import sha256 from "crypto-js/sha256";
  import { useAppTheme } from "@/composables/useTheme";
  const { theme } = useAppTheme();
=======
import { computed } from "vue";
import Identicon from "identicon.js";
import sha256 from "crypto-js/sha256";
import { useTheme } from "@/composables/useTheme";
const { theme } = useTheme()
>>>>>>> parent of 666ae3d (Use automated formatting tools)

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
    default: "",
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
});

// Generate Identicon based on text and theme
const identiconData = computed(() => {
  // Hash the text
  const hash = sha256(props.text).toString();

  // Generate the identicon and get the data for the img src
  const data = new Identicon(hash, {
    // If theme is dark, use a dark background
    background: theme.value === "dark" ? [0, 0, 0, 255] : [255, 255, 255, 255],
    margin: 0.2,
    size: 420,
    format: "svg",
  }).toString();

  // Return the data as a base64 SVG for the src of the img
  return "data:image/svg+xml;base64," + data;
});
</script>

<template>
  <div>
    <img
      v-if="src"
      :src="src"
      :alt="text"
      :class="[
        isLarge ? 'h-48 w-48' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
<<<<<<< HEAD
      :src="src"
    >
    <img
      v-else
      :alt="text"
      class="border border-gray-300 dark:border-gray-600"
=======
    >
    <img
      v-else
      class="border dark:border-gray-600"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      :class="[
        isLarge ? 'h-48 w-48' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
      :src="identiconData"
<<<<<<< HEAD
=======
      :alt="text"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
    >
  </div>
</template>
