<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { Image } from '@/__generated__/graphql';
import AppImage from '@/components/image/AppImage.vue';
import ModelPreviewTile from '@/components/image/ModelPreviewTile.vue';
import AddToImageFavorites from '@/components/favorites/AddToImageFavorites.vue';
import { is3DModelFile } from '@/utils/fileTypeUtils';
import { getPreferredImageUrl } from '@/utils/imageVariants';

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
  // When provided, skip making a separate API call for favorite status
  initialIsFavorited: {
    type: Boolean,
    default: undefined,
  },
});

const getImageAlt = (image: Image) => {
  return image.alt || image.caption || 'Image';
};

const imageUrl = computed(() =>
  getPreferredImageUrl({
    source: props.image,
    preferred: ['list320', 'list160'],
    originalUrl: props.image.url,
  }) || ''
);
</script>

<template>
  <div class="group relative aspect-square overflow-hidden rounded">
    <NuxtLink
      :to="`/u/${props.username}/images/${props.image.id}`"
      class="block h-full w-full"
    >
      <!-- 3D models get a static tile; the viewer loads on the image page -->
      <ModelPreviewTile
        v-if="props.image.url && is3DModelFile(props.image.url)"
        :model-url="props.image.url"
        :alt="getImageAlt(props.image) || '3D model'"
      />
      <!-- Regular image -->
      <AppImage
        v-else-if="imageUrl"
        :src="imageUrl"
        :alt="getImageAlt(props.image) ?? 'Image'"
        class="h-full w-full object-cover"
        :width="300"
        :height="300"
        sizes="(min-width: 1280px) 20vw, (min-width: 768px) 25vw, 50vw"
        loading="lazy"
        decoding="async"
      />

      <!-- Overlay with sensitive content warning -->
      <div
        v-if="props.image.hasSensitiveContent || props.image.hasSpoiler"
        class="absolute inset-0 flex items-center justify-center bg-black/50"
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
      class="absolute top-2 right-2 z-10 rounded-md bg-black/50 p-1.5 transition-all duration-200 hover:bg-white/70"
      @click.stop.prevent
    >
      <AddToImageFavorites
        :allow-add-to-list="allowAddToList"
        :image-id="props.image.id"
        :image-caption="props.image.caption || ''"
        :initial-is-favorited="initialIsFavorited"
        size="small"
      />
    </div>
  </div>
</template>
