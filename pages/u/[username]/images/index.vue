<script lang="ts" setup>
import { computed, ref, defineProps, watch } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import { GET_USER_IMAGES } from '@/graphQLData/image/queries';
import type { Image } from '@/__generated__/graphql';
import ImageListItem from '@/components/image/ImageListItem.vue';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';

const route = useRoute();
const { selectedChannels, hasSelectedChannels } = useSelectedChannelsFromQuery();

const username = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const imagesWhere = computed(() => {
  if (!hasSelectedChannels.value) {
    return undefined;
  }
  return {
    Album: {
      Discussions_SOME: {
        DiscussionChannels_SOME: {
          channelUniqueName_IN: selectedChannels.value,
        },
      },
    },
  };
});

const pageSize = 24; // Show 24 images per page
const currentOffset = ref(0);
const isLoadingMore = ref(false);

const {
  result: userImagesResult,
  loading: userImagesLoading,
  error: userImagesError,
  fetchMore,
} = useQuery(
  GET_USER_IMAGES,
  () => ({
    username: username.value,
    offset: 0,
    limit: pageSize,
    where: imagesWhere.value,
  }),
  {
    fetchPolicy: 'cache-first',
  }
);

const user = computed(() => {
  if (userImagesError.value) return null;
  if (userImagesResult.value && userImagesResult.value.users.length > 0) {
    return userImagesResult.value.users[0];
  }
  return null;
});

const images = computed((): Image[] => {
  if (!user.value?.Images) return [];
  return user.value.Images;
});

defineProps({
  allowAddToList: {
    type: Boolean,
    default: true,
  },
});

const totalImageCount = computed(() => {
  return user.value?.ImagesAggregate?.count || 0;
});

const hasMoreImages = computed(() => {
  return images.value.length < totalImageCount.value;
});

watch([imagesWhere, username], () => {
  currentOffset.value = 0;
});

const loadMoreImages = async () => {
  if (!hasMoreImages.value || isLoadingMore.value) return;

  const newOffset = currentOffset.value + pageSize;
  isLoadingMore.value = true;

  try {
    await fetchMore({
      variables: {
        username: username.value,
        offset: newOffset,
        limit: pageSize,
        where: imagesWhere.value,
      },
      updateQuery: (previousResult, { fetchMoreResult }) => {
        if (!fetchMoreResult) return previousResult;

        const newImages = fetchMoreResult.users[0].Images;

        return {
          ...previousResult,
          users: [
            {
              ...previousResult.users[0],
              Images: [...previousResult.users[0].Images, ...newImages],
              ImagesAggregate: fetchMoreResult.users[0].ImagesAggregate,
            },
          ],
        };
      },
    });

    currentOffset.value = newOffset;
  } catch (error) {
    console.error('Error loading more images:', error);
  } finally {
    isLoadingMore.value = false;
  }
};

// Utility functions moved to ImageListItem component
</script>

<template>
  <div class="w-full">
    <!-- Initial loading state -->
    <div
      v-if="userImagesLoading && images.length === 0"
      class="flex h-64 items-center justify-center"
    >
      <div class="text-lg">Loading images...</div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="userImagesError"
      class="flex h-64 flex-col items-center justify-center text-center"
    >
      <h2 class="mb-4 text-xl font-bold">Error Loading Images</h2>
      <p class="mb-4 text-gray-600 dark:text-gray-400">
        There was an error loading the images. Please try again later.
      </p>
    </div>

    <!-- No images state -->
    <div
      v-else-if="images.length === 0"
      class="flex h-64 flex-col items-center justify-center text-center"
    >
      <h2 class="mb-4 text-xl font-bold">No Images Yet</h2>
      <p class="text-gray-600 dark:text-gray-400">
        {{ username }} hasn't uploaded any images yet.
      </p>
    </div>

    <!-- Images grid -->
    <div v-else class="space-y-6">
      <div
        class="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        <ImageListItem
          v-for="image in images"
          :key="image.id"
          :image="image"
          :username="username"
        />
      </div>

      <!-- Load more button -->
      <div v-if="hasMoreImages" class="flex justify-center">
        <button
          type="button"
          :disabled="isLoadingMore"
          class="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="loadMoreImages"
        >
          <span v-if="isLoadingMore">Loading...</span>
          <span v-else>Load More Images</span>
        </button>
      </div>
    </div>
  </div>
</template>
