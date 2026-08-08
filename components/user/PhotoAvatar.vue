<script setup lang="ts">
import AppImage from '@/components/image/AppImage.vue';

withDefaults(defineProps<{
  src: string;
  alt: string;
  isSquare?: boolean;
  isLarge?: boolean;
}>(), {
  isSquare: false,
  isLarge: false,
});
</script>
<template>
  <AppImage
    :class="[
      isLarge ? '' : 'h-8 w-8',
      isSquare ? 'rounded-lg' : 'rounded-full',
    ]"
    :src="src"
    :alt="alt"
    :width="isLarge ? undefined : 32"
    :height="isLarge ? undefined : 32"
    :loading="isLarge ? 'eager' : 'lazy'"
    :decoding="'async'"
    :fetchpriority="isLarge ? 'high' : 'auto'"
  />
</template>
