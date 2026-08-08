<script setup lang="ts">
import { computed, ref } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';
import AppImage from '@/components/image/AppImage.vue';

const props = withDefaults(
  defineProps<{
    src: string;
    alt?: string;
    rounded?: boolean;
    fullWidth?: boolean;
    width?: number | string;
    height?: number | string;
    sizes?: string;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    fetchpriority?: 'high' | 'low' | 'auto';
  }>(),
  {
    alt: '',
    rounded: false,
    fullWidth: false,
    width: undefined,
    height: undefined,
    sizes: '',
    loading: 'lazy',
    decoding: 'async',
    fetchpriority: 'auto',
  }
);

const visible = ref(false);
const index = ref(0);
const images = ref<string[]>([props.src]);
const imageClasses = computed(() => ({
  'w-full': props.fullWidth,
  'rounded-full': props.rounded,
}));

const handleImageClick = () => {
  visible.value = true;
};
</script>

<template>
  <div>
    <AppImage
      :src="src"
      :alt="alt"
      class="cursor-pointer"
      :class="imageClasses"
      :width="width"
      :height="height"
      :sizes="sizes"
      :loading="loading"
      :decoding="decoding"
      :fetchpriority="fetchpriority"
      @click="handleImageClick"
    />
    <vue-easy-lightbox
      v-if="visible"
      :visible="visible"
      :imgs="images"
      :index="index"
      @hide="visible = false"
    />
  </div>
</template>
