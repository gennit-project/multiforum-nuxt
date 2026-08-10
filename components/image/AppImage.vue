<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { canOptimizeImageUrl } from '@/utils/imageOptimization';
import { useRuntimeConfig } from 'nuxt/app';

defineOptions({
  inheritAttrs: false,
});
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
  }>(),
  {
    width: undefined,
    height: undefined,
    sizes: '',
    loading: 'lazy',
    decoding: 'async',
    fetchpriority: 'auto',
  }
);

const attrs = useAttrs();
const runtimeConfig = useRuntimeConfig();
const activeImageProvider = computed(
  () => String(runtimeConfig.public.imageProvider || 'ipx')
);
const shouldOptimize = computed(() =>
  canOptimizeImageUrl(props.src, activeImageProvider.value)
);
</script>

<template>
  <NuxtImg
    v-if="shouldOptimize"
    v-bind="attrs"
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="sizes || undefined"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
  />
  <img
    v-else
    v-bind="attrs"
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :decoding="decoding"
    :fetchpriority="fetchpriority"
  >
</template>
