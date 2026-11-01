<script lang="ts" setup>
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { GetReusableUserImagesQuery, GetReusableFavoriteImagesQuery, GetReusableUserImagesQueryVariables } from '@/__generated__/operations';
import { computed, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import { GetReusableUserImagesDocument as GET_REUSABLE_USER_IMAGES, GetReusableFavoriteImagesDocument as GET_REUSABLE_FAVORITE_IMAGES } from '@/__generated__/operations';
import AlbumReusableImageGrid from './AlbumReusableImageGrid.vue';
import LoadMore from '@/components/LoadMore.vue';
import { buildReusableImageWhere } from './reusableImageTypes';
import type { ReusableImage } from './reusableImageTypes';

const PAGE_SIZE = 24;

type UserImagesResult = GetReusableUserImagesQuery | GetReusableFavoriteImagesQuery;

const props = defineProps<{
  source: 'uploads' | 'favorites';
  searchTerm: string;
  selectedImageIds: string[];
  pendingImageIds: string[];
  isLimitReached: boolean;
}>();

const emit = defineEmits<{
  toggleImage: [image: ReusableImage];
}>();

const usernameVar = useUsername();
const currentOffset = ref(0);
const isLoadingMore = ref(false);

const isFavorites = computed(() => props.source === 'favorites');

const query = computed<TypedDocumentNode<UserImagesResult, GetReusableUserImagesQueryVariables>>(() =>
  isFavorites.value ? GET_REUSABLE_FAVORITE_IMAGES : GET_REUSABLE_USER_IMAGES
);

const buildVariables = (offset: number) => ({
  username: usernameVar.value,
  where: buildReusableImageWhere(props.searchTerm),
  offset,
  limit: PAGE_SIZE,
});

const { result, loading, error, fetchMore } = useQuery(
  query,
  () => buildVariables(0),
  () => ({
    enabled: Boolean(usernameVar.value),
    fetchPolicy: 'cache-and-network',
  })
);

const user = computed(() => result.value?.users?.[0] ?? null);

const images = computed<ReusableImage[]>(
  () => (user.value ? (isFavorites.value && 'FavoriteImages' in user.value ? user.value.FavoriteImages : 'Images' in user.value ? user.value.Images : []) : []).map((image) => ({ ...image, url: image.url || '' }))
);

const totalCount = computed(
  () =>
    (user.value ? (isFavorites.value && 'FavoriteImagesConnection' in user.value ? user.value.FavoriteImagesConnection.aggregate.count?.nodes : 'ImagesConnection' in user.value ? user.value.ImagesConnection.aggregate.count?.nodes : 0) : 0) ?? 0
);

const hasMore = computed(() => images.value.length < totalCount.value);

const errorMessage = computed(() => error.value?.message ?? null);

const emptyMessage = computed(() =>
  isFavorites.value
    ? 'You have not favorited any images yet.'
    : 'You have not uploaded any images yet.'
);

// A new search restarts paging from the first page; the base query refetches at
// offset 0, so reset our paging cursor to match.
watch(
  () => [props.searchTerm, props.source, usernameVar.value],
  () => {
    currentOffset.value = 0;
  }
);

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return;

  const scope = JSON.stringify([props.searchTerm, props.source, usernameVar.value]);
  const sameScope = () => scope === JSON.stringify([props.searchTerm, props.source, usernameVar.value]);
  const newOffset = currentOffset.value + PAGE_SIZE;
  isLoadingMore.value = true;

  try {
    await fetchMore({
      variables: buildVariables(newOffset),
      updateQuery: (previous, { fetchMoreResult }) => {
        if (!fetchMoreResult || !sameScope()) return previous;
        const prevUser = previous.users?.[0];
        const nextUser = fetchMoreResult.users?.[0];
        if (!prevUser || !nextUser) return previous;

        if (isFavorites.value && 'FavoriteImages' in prevUser && 'FavoriteImages' in nextUser) {
          return {
            ...previous,
            users: [
              {
                ...prevUser,
                FavoriteImages: [
                  ...(prevUser.FavoriteImages || []),
                  ...nextUser.FavoriteImages.filter((image) => !prevUser.FavoriteImages.some((old) => old.id === image.id)),
                ],
                FavoriteImagesConnection: nextUser.FavoriteImagesConnection,
              },
            ],
          };
        }

        if (!('Images' in prevUser) || !('Images' in nextUser)) return previous;
        return {
          ...previous,
          users: [
            {
              ...prevUser,
              Images: [...(prevUser.Images || []), ...nextUser.Images.filter((image) => !prevUser.Images.some((old) => old.id === image.id))],
              ImagesConnection: nextUser.ImagesConnection,
            },
          ],
        };
      },
    });

    if (sameScope()) currentOffset.value = newOffset;
  } finally {
    isLoadingMore.value = false;
  }
};
</script>

<template>
  <div>
    <AlbumReusableImageGrid
      :images="images"
      :selected-image-ids="selectedImageIds"
      :pending-image-ids="pendingImageIds"
      :is-limit-reached="isLimitReached"
      :loading="loading"
      :error="errorMessage"
      :empty-message="emptyMessage"
      @toggle-image="emit('toggleImage', $event)"
    />

    <LoadMore
      v-if="images.length > 0"
      class="mt-2"
      :loading="isLoadingMore"
      :reached-end-of-results="!hasMore"
      @load-more="loadMore"
    />
  </div>
</template>
