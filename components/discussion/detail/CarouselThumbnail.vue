<script lang="ts" setup>
import { computed } from 'vue';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import AppImage from '@/components/image/AppImage.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';
import { getPreferredImageUrl } from '@/utils/imageVariants';

const props = defineProps({
  image: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 80,
  },
  width: {
    type: Number,
    default: null,
  },
  height: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(['click']);

const thumbnailWidth = computed(() => props.width ?? props.size);
const thumbnailHeight = computed(() => props.height ?? props.size);
const sizeStyle = computed(() => ({
  width: `${thumbnailWidth.value}px`,
  height: `${thumbnailHeight.value}px`,
}));
const imageUrl = computed(() =>
  getPreferredImageUrl({
    source: props.image,
    preferred: ['list160', 'list80'],
    originalUrl: props.image?.url,
  }) || ''
);
</script>

<template>
  <div
    class="shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all lg:mb-2 lg:last:mb-0"
    :class="{
      'border-orange-500': isActive,
      'border-gray-300 hover:border-gray-400': !isActive,
    }"
    :style="sizeStyle"
    @click="emit('click')"
  >
    <ModelViewer
      v-if="image && image.url && hasGlbExtension(image.url)"
      :model-url="image.url"
      :model-alt="image.alt || image.caption || '3D model thumbnail'"
      :show-fullscreen-button="false"
      :height="`${thumbnailHeight}px`"
      :width="`${thumbnailWidth}px`"
      class="rounded"
      :style="sizeStyle"
    />
    <ClientOnly v-else-if="image && image.url && hasStlExtension(image.url)">
      <StlViewer
        :src="image.url"
        :width="thumbnailWidth"
        :height="thumbnailHeight"
        class="rounded"
        :style="sizeStyle"
      />
    </ClientOnly>
    <AppImage
      v-else-if="image"
      :src="imageUrl"
      :alt="image.alt || ''"
      class="h-full w-full rounded object-cover shadow-sm"
      :width="thumbnailWidth"
      :height="thumbnailHeight"
      :sizes="`${thumbnailWidth}px`"
      loading="lazy"
      decoding="async"
    />
  </div>
</template>
