<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useUsername } from '@/composables/useAuthState';
import {
  GET_REUSABLE_USER_IMAGES,
  GET_REUSABLE_FAVORITE_IMAGES,
} from '@/graphQLData/image/queries';
import AlbumReusableImageGrid from './AlbumReusableImageGrid.vue';
import LoadMore from '@/components/LoadMore.vue';
import { buildReusableImageWhere } from './reusableImageTypes';
import type { ReusableImage } from './reusableImageTypes';

const PAGE_SIZE = 24;

type Aggregate = { count?: number | null } | null;

type UserImagesResult = {
  users?: Array<{
    Images?: ReusableImage[] | null;
    ImagesAggregate?: Aggregate;
    FavoriteImages?: ReusableImage[] | null;
    FavoriteImagesAggregate?: Aggregate;
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
const currentOffset = ref(0);
const isLoadingMore = ref(false);

const isFavorites = computed(() => props.source === 'favorites');

const query = computed(() =>
  isFavorites.value ? GET_REUSABLE_FAVORITE_IMAGES : GET_REUSABLE_USER_IMAGES
);

const buildVariables = (offset: number) => ({
  username: usernameVar.value,
  where: buildReusableImageWhere(props.searchTerm),
  offset,
  limit: PAGE_SIZE,
});

const { result, loading, error, fetchMore } = useQuery<UserImagesResult>(
  query,
  () => buildVariables(0),
  () => ({
    enabled: Boolean(usernameVar.value),
    fetchPolicy: 'cache-and-network',
  })
);

const user = computed(() => result.value?.users?.[0] ?? null);

const images = computed<ReusableImage[]>(
  () => (isFavorites.value ? user.value?.FavoriteImages : user.value?.Images) || []
);

const totalCount = computed(
  () =>
    (isFavorites.value
      ? user.value?.FavoriteImagesAggregate?.count
      : user.value?.ImagesAggregate?.count) ?? 0
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
  () => props.searchTerm,
  () => {
    currentOffset.value = 0;
  }
);

const loadMore = async () => {
  if (!hasMore.value || isLoadingMore.value) return;

  const newOffset = currentOffset.value + PAGE_SIZE;
  isLoadingMore.value = true;

  try {
    await fetchMore({
      variables: buildVariables(newOffset),
      updateQuery: (previous: UserImagesResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previous;
        const prevUser = previous.users?.[0];
        const nextUser = fetchMoreResult.users?.[0];
        if (!prevUser || !nextUser) return previous;

        if (isFavorites.value) {
          return {
            ...previous,
            users: [
              {
                ...prevUser,
                FavoriteImages: [
                  ...(prevUser.FavoriteImages || []),
                  ...(nextUser.FavoriteImages || []),
                ],
                FavoriteImagesAggregate: nextUser.FavoriteImagesAggregate,
              },
            ],
          };
        }

        return {
          ...previous,
          users: [
            {
              ...prevUser,
              Images: [...(prevUser.Images || []), ...(nextUser.Images || [])],
              ImagesAggregate: nextUser.ImagesAggregate,
            },
          ],
        };
      },
    });

    currentOffset.value = newOffset;
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
      :is-limit-reached="isLimitReached"
      :loading="loading"
      :error="errorMessage"
      :empty-message="emptyMessage"
      @add-image="emit('addImage', $event)"
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
