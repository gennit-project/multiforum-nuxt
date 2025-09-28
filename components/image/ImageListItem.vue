<script setup lang="ts">
import type { PropType } from 'vue';
import type { Image } from '@/__generated__/graphql';
import ModelViewer from '@/components/ModelViewer.vue';
import StlViewer from '@/components/download/StlViewer.vue';
import AddToImageFavorites from '@/components/favorites/AddToImageFavorites.vue';

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

// Check file types
const hasGlbExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.glb');
};

const hasStlExtension = (url: string) => {
  return url?.toLowerCase().endsWith('.stl');
};

const getImageAlt = (image: Image) => {
  return image.alt || image.caption || 'Image';
};
</script>

<template>
  <div
    class="group relative cursor-pointer overflow-hidden rounded-lg bg-white shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
  >
    <NuxtLink
      :to="`/u/${props.username}/images/${props.image.id}`"
      class="block"
    >
      <!-- Image container with fixed aspect ratio -->
      <div class="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
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
        />

        <!-- Overlay with sensitive content warning -->
        <div
          v-if="props.image.hasSensitiveContent || props.image.hasSpoiler"
          class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div class="p-2 text-center text-white">
            <div v-if="props.image.hasSensitiveContent" class="text-xs">
              ⚠️ Sensitive
            </div>
            <div v-if="props.image.hasSpoiler" class="text-xs">🚫 Spoiler</div>
          </div>
        </div>
      </div>

      <!-- Card content -->
      <div class="p-4">
        <div
          v-if="props.image.caption"
          class="mb-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          {{ props.image.caption }}
        </div>
        <div
          v-else-if="props.image.alt"
          class="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {{ props.image.alt }}
        </div>

        <div class="flex items-center justify-between">
          <div class="text-xs text-gray-500 dark:text-gray-500">
            {{ new Date(props.image.createdAt).toLocaleDateString() }}
          </div>

          <!-- Favorite button -->
          <div
            v-if="props.showFavoriteButton"
            class="flex-shrink-0"
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
      </div>
    </NuxtLink>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
