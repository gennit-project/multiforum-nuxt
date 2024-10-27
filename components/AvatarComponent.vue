<script lang="ts" setup>
import { computed } from "vue";
import Identicon from "identicon.js";
import sha256 from "crypto-js/sha256";
import gql from "graphql-tag";

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

const GET_THEME = gql`
  query getTheme {
    theme @client
  }
`;

// Use Nuxt 3’s useLazyAsyncQuery to fetch the theme
const { data: themeResult, error: themeError } = useAsyncQuery(GET_THEME);

// Computed property to return the theme or a default value if there's an error or it's still loading
const theme = computed(() => {
  if (themeError.value || !themeResult.value) {
    return "dark";
  }
  return themeResult.value;
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
    >
    <img
      v-else
      class="border dark:border-gray-600"
      :class="[
        isLarge ? 'h-72 w-72' : '',
        isMedium ? 'h-12 w-12' : '',
        isSmall ? 'h-8 w-8' : '',
        isSquare ? 'rounded-lg' : 'rounded-full',
      ]"
      :src="identiconData"
      :alt="text"
    >
  </div>
</template>
