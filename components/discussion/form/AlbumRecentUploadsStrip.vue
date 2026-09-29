<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { GET_REUSABLE_USER_IMAGES } from '@/graphQLData/image/queries';
import AppImage from '@/components/image/AppImage.vue';
import { buildReusableImageWhere } from './reusableImageTypes';
import type { ReusableImage } from './reusableImageTypes';

const RECENT_LIMIT = 8;

type RecentUploadsResult = {
  users?: Array<{ Images?: ReusableImage[] | null }> | null;
};

const props = defineProps<{
  selectedImageIds: string[];
}>();

const emit = defineEmits<{
  addImage: [image: ReusableImage];
  browse: [];
}>();

const usernameVar = useUsername();

const { result } = useQuery<RecentUploadsResult>(
  GET_REUSABLE_USER_IMAGES,
  () => ({
    username: usernameVar.value,
    where: buildReusableImageWhere(''),
    offset: 0,
    limit: RECENT_LIMIT,
  }),
  () => ({
    enabled: Boolean(usernameVar.value),
    fetchPolicy: 'cache-and-network',
  })
);

const images = computed<ReusableImage[]>(
  () => result.value?.users?.[0]?.Images || []
);
const inAlbum = computed(() => new Set(props.selectedImageIds));
const label = (image: ReusableImage) =>
  image.alt || image.caption || 'Recent upload';
</script>

<template>
  <div
    v-if="images.length > 0"
    data-testid="album-recent-uploads"
  >
    <div class="mb-2 flex items-baseline justify-between">
      <h4 class="text-sm font-medium text-gray-800 dark:text-gray-100">
        Recent uploads
      </h4>
      <button
        type="button"
        class="text-sm text-orange-700 hover:underline focus:ring-2 focus:ring-orange-500/40 focus:outline-none dark:text-orange-400"
        @click="emit('browse')"
      >
        Browse all
      </button>
    </div>
    <ul class="-mr-4 flex gap-2 overflow-x-auto pr-4 pb-1">
      <li
        v-for="image in images"
        :key="image.id"
        class="shrink-0"
      >
        <button
          type="button"
          class="block overflow-hidden rounded-lg border border-gray-300 hover:ring-2 hover:ring-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:ring-0 dark:border-gray-600"
          data-testid="album-recent-upload"
          :aria-label="
            inAlbum.has(image.id)
              ? `${label(image)} (already in album)`
              : `Add ${label(image)} to album`
          "
          :disabled="inAlbum.has(image.id)"
          @click="emit('addImage', image)"
        >
          <AppImage
            :src="image.url"
            alt=""
            class="h-[72px] w-[72px] object-cover"
            :width="72"
            :height="72"
            loading="lazy"
            decoding="async"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
