<script lang="ts">
import { defineComponent, computed } from "vue";
import { useQuery } from "@vue/apollo-composable";
import gql from "graphql-tag";

export default defineComponent({
  name: "PhotoAvatar",
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    isSquare: {
      type: Boolean,
      required: false,
      default: false
    },
    isLarge: {
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
      return themeResult.value?.theme;
    });

    return {
      theme,
    };
  },
});
</script>
<template>
  <img 
    :class="[isLarge ? '' :'h-8 w-8', isSquare ? 'rounded-lg' : 'rounded-full']"
    :src="src" 
    :alt="alt"
<<<<<<< HEAD
    :class="[isLarge ? '' : 'h-8 w-8', isSquare ? 'rounded-lg' : 'rounded-full']"
    :src="src"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
  >
</template>


