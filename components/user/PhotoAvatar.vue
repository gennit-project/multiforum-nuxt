<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import gql from 'graphql-tag';

withDefaults(defineProps<{
  src: string;
  alt: string;
  isSquare?: boolean;
  isLarge?: boolean;
}>(), {
  isSquare: false,
  isLarge: false,
});

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

const _theme = computed(() => {
  if (themeLoading.value || themeError.value) {
    return '';
  }
  return themeResult.value?.theme;
});
</script>
<template>
  <img
    :class="[
      isLarge ? '' : 'h-8 w-8',
      isSquare ? 'rounded-lg' : 'rounded-full',
    ]"
    :src="src"
    :alt="alt"
  >
</template>
