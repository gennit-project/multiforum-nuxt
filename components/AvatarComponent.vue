<script lang="ts" setup>
  import { computed } from "vue";
  import Identicon from "identicon.js";
  import sha256 from "crypto-js/sha256";
  import { useTheme } from "@/composables/useTheme";
  const { theme } = useTheme();

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
      :alt="text"
      :class="[
        isLarge ? 'h-48 w-48' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
      :src="src"
    />
    <img
      v-else
      :alt="text"
      class="border border-black dark:border-gray-600"
      :class="[
        isLarge ? 'h-48 w-48' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
      :src="identiconData"
    />
  </div>
</template>
