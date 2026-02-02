<script setup lang="ts">
import type { PropType } from 'vue';
import type { Image } from '@/__generated__/graphql';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import AddToImageFavorites from '@/components/favorites/AddToImageFavorites.vue';
import { hasGlbExtension, hasStlExtension } from '@/utils/fileTypeUtils';

const props = defineProps({
  allowAddToList: {
    type: Boolean,
    default: true,
  },
  image: {
    type: Object as PropType<Image>,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  showFavoriteButton: {
    type: Boolean,
    default: true,
  },
});

const getImageAlt = (image: Image) => {
  return image.alt || image.caption || 'Image';
};
</script>

<template>
  <div class="group relative aspect-square overflow-hidden rounded">
    <NuxtLink
      :to="`/u/${props.username}/images/${props.image.id}`"
      class="block h-full w-full"
    >
      <!-- 3D Model viewer for GLB files -->
      <ModelViewer
        v-if="props.image.url && hasGlbExtension(props.image.url)"
        :model-url="props.image.url"
        height="100%"
        width="100%"
        class="h-full w-full object-cover"
      />
      <!-- STL viewer for STL files -->
      <ClientOnly
        v-else-if="props.image.url && hasStlExtension(props.image.url)"
      >
        <StlViewer
          :src="props.image.url"
          :width="300"
          :height="300"
          class="h-full w-full object-cover"
        />
      </ClientOnly>
      <!-- Regular image -->
      <img
        v-else-if="props.image.url"
        :src="props.image.url"
        :alt="getImageAlt(props.image) ?? 'Image'"
        class="h-full w-full object-cover"
        loading="lazy"
      >

      <!-- Overlay with sensitive content warning -->
      <div
        v-if="props.image.hasSensitiveContent || props.image.hasSpoiler"
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div class="p-2 text-center text-white">
          <div v-if="props.image.hasSensitiveContent" class="text-xs">
            Sensitive
          </div>
          <div v-if="props.image.hasSpoiler" class="text-xs">Spoiler</div>
        </div>
      </div>
    </NuxtLink>

    <!-- Favorite button - top right corner -->
    <div
      v-if="props.showFavoriteButton"
      class="absolute right-2 top-2 z-10 rounded-md bg-black bg-opacity-50 p-1.5 transition-all duration-200 hover:bg-opacity-70"
      @click.stop.prevent
    >
      <AddToImageFavorites
        :allow-add-to-list="allowAddToList"
        :image-id="props.image.id"
        :image-caption="props.image.caption || ''"
        size="small"
      />
    </div>
  </div>
</template>
