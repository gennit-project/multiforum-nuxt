<script lang="ts">
import { defineComponent, computed } from "vue";
import Identicon from 'identicon.js';
import sha256 from 'crypto-js/sha256';
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";

export default defineComponent({
  name: "AvatarPicture",
  props: {
    text: {
      type: String,
      required: true
    },
    isSquare: {
      type: Boolean,
      required: false,
      default: false
    },
    src: {
      type: String,
      required: false,
      default: ""
    },
    isLarge: {
      type: Boolean,
      required: false,
      default: false
    },
    isMedium: {
      type: Boolean,
      required: false,
      default: false
    },
    isSmall: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  setup() {
    const GET_THEME = gql`
      query getTheme {
        theme @client
      }
    `;

    const {
      result: themeResult,
      loading: themeLoading,
      error: themeError,
    } = useQuery(GET_THEME);

    const theme = computed(() => {
      if (themeLoading.value || themeError.value) {
        return "";
      }
      return themeResult.value.theme;
    });

    return {
      theme,
    };
  },
  computed: {
    identiconData() {
      // Hash the text
      const hash = sha256(this.text).toString();

      // Generate the identicon and get the data for the img src
      const data = new Identicon(hash, {
        // If theme is dark, use a dark background
        background: this.theme === 'dark' ? [0, 0, 0, 255] : [255, 255, 255, 255],
        margin: 0.2,
        size: 420,
        format: 'svg'
      }).toString();

      // Return the data as a base64 SVG for the src of the img
      return 'data:image/svg+xml;base64,' + data;
    },
  },
});
</script>
<template>
  <img 
    v-if="src" 
    :src="src" 
    :alt="text"
    :class="[
      isLarge ? 'h-48 w-48' : '',
      isMedium ? 'h-20 w-20' : '',
      isSmall ? 'h-7 w-7' : '', 
      isSquare ? 'rounded-lg' : 'rounded-full']"
  >
  <img 
    v-else
    class="border dark:border-gray-600"
    :class="[
      isLarge ? 'h-72 w-72' : '',
      isMedium ? 'h-20 w-20' : '',
      isSmall ? 'h-7 w-7' : '', 
      isSquare ? 'rounded-lg' : 'rounded-full']"
    :src="identiconData" 
    :alt="text"
  >
</template>


