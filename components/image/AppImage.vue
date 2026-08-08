<script setup lang="ts">
import { computed } from 'vue';
import { canOptimizeImageUrl } from '@/utils/imageOptimization';

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    sizes?: string;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    fetchpriority?: 'high' | 'low' | 'auto';
    class?: string;
    ariaHidden?: string;
  }>(),
  {
    width: undefined,
    height: undefined,
    sizes: '',
    loading: 'lazy',
    decoding: 'async',
    fetchpriority: 'auto',
    class: '',
    ariaHidden: undefined,
  }
);

const shouldOptimize = computed(() => canOptimizeImageUrl(props.src));
</script>

<template>
  <NuxtImg
    v-if="shouldOptimize"
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="sizes || undefined"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
    :class="props.class"
    :aria-hidden="ariaHidden"
  />
  <img
    v-else
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
    :class="props.class"
    :aria-hidden="ariaHidden"
  >
</template>
