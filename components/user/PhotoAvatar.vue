<script setup lang="ts">
import { computed } from 'vue';
import AppImage from '@/components/image/AppImage.vue';
import { getPreferredImageUrl, type ImageVariantKey } from '@/utils/imageVariants';

const props = withDefaults(defineProps<{
  src: string;
  alt: string;
  isSquare?: boolean;
  isLarge?: boolean;
  variantSource?: Record<string, unknown> | null;
}>(), {
  isSquare: false,
  isLarge: false,
  variantSource: null,
});

const preferredAvatarVariants = computed<ImageVariantKey[]>(() =>
  props.isLarge ? ['avatar96', 'avatar64', 'avatar48'] : ['avatar32', 'avatar48']
);

const imageUrl = computed(() =>
  getPreferredImageUrl({
    source: props.variantSource,
    preferred: preferredAvatarVariants.value,
    originalUrl: props.src,
  }) || ''
);
</script>
<template>
  <AppImage
    :class="[
      isLarge ? '' : 'h-8 w-8',
      isSquare ? 'rounded-lg' : 'rounded-full',
    ]"
    :src="imageUrl"
    :alt="alt"
    :width="isLarge ? undefined : 32"
    :height="isLarge ? undefined : 32"
    :loading="isLarge ? 'eager' : 'lazy'"
    :decoding="'async'"
    :fetchpriority="isLarge ? 'high' : 'auto'"
  />
</template>
