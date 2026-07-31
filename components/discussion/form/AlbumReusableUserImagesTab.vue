<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import {
  GET_REUSABLE_USER_IMAGES,
  GET_REUSABLE_FAVORITE_IMAGES,
} from '@/graphQLData/image/queries';
import AlbumReusableImageGrid from './AlbumReusableImageGrid.vue';
import { buildReusableImageWhere } from './reusableImageTypes';
import type { ReusableImage } from './reusableImageTypes';

// The page size for the first fetch. Loading more images is added in a later
// phase; for now each tab shows its most recent page.
const PAGE_SIZE = 24;

type UserImagesResult = {
  users?: Array<{
    Images?: ReusableImage[] | null;
    ImagesAggregate?: { count?: number | null } | null;
    FavoriteImages?: ReusableImage[] | null;
    FavoriteImagesAggregate?: { count?: number | null } | null;
  }> | null;
};

const props = defineProps<{
  source: 'uploads' | 'favorites';
  searchTerm: string;
  selectedImageIds: string[];
  isLimitReached: boolean;
}>();

const emit = defineEmits<{
  addImage: [image: ReusableImage];
}>();

const usernameVar = useUsername();

const query = computed(() =>
  props.source === 'favorites'
    ? GET_REUSABLE_FAVORITE_IMAGES
    : GET_REUSABLE_USER_IMAGES
);

const { result, loading, error } = useQuery<UserImagesResult>(
  query,
  () => ({
    username: usernameVar.value,
    where: buildReusableImageWhere(props.searchTerm),
    offset: 0,
    limit: PAGE_SIZE,
  }),
  () => ({
    enabled: Boolean(usernameVar.value),
    fetchPolicy: 'cache-and-network',
  })
);

const images = computed<ReusableImage[]>(() => {
  const user = result.value?.users?.[0];
  if (!user) return [];
  return (
    (props.source === 'favorites' ? user.FavoriteImages : user.Images) || []
  );
});

const emptyMessage = computed(() =>
  props.source === 'favorites'
    ? 'You have not favorited any images yet.'
    : 'You have not uploaded any images yet.'
);

const errorMessage = computed(() => error.value?.message ?? null);
</script>

<template>
  <AlbumReusableImageGrid
    :images="images"
    :selected-image-ids="selectedImageIds"
    :is-limit-reached="isLimitReached"
    :loading="loading"
    :error="errorMessage"
    :empty-message="emptyMessage"
    @add-image="emit('addImage', $event)"
  />
</template>
