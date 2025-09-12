<script lang="ts" setup>
import { computed } from 'vue';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';

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
});

const emit = defineEmits(['click']);

const hasGlbExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.glb');
};

const hasStlExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.stl');
};

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<template>
  <div
    class="flex-shrink-0 cursor-pointer rounded border-2 transition-all overflow-hidden lg:mb-2 lg:last:mb-0"
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
      :height="`${size}px`"
      :width="`${size}px`"
      class="rounded"
      :style="sizeStyle"
    />
    <ClientOnly
      v-else-if="image && image.url && hasStlExtension(image.url)"
    >
      <StlViewer
        :src="image.url"
        :width="size"
        :height="size"
        class="rounded"
        :style="sizeStyle"
      />
    </ClientOnly>
    <img
      v-else-if="image"
      :src="image.url || ''"
      :alt="image.alt || ''"
      class="rounded object-cover shadow-sm w-full h-full"
      :style="sizeStyle"
    >
  </div>
</template>