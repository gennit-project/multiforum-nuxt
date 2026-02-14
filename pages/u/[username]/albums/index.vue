<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute } from 'nuxt/app';
import { GET_USER_ALBUMS } from '@/graphQLData/image/queries';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';

const route = useRoute();
const { selectedChannels, hasSelectedChannels } = useSelectedChannelsFromQuery();

const username = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const albumsWhere = computed(() => {
  const userMatchWhere = {
    OR: [
      { Owner: { username: username.value } },
      { Images_SOME: { Uploader: { username: username.value } } },
    ],
  };

  if (!hasSelectedChannels.value) {
    return userMatchWhere;
  }

  return {
    AND: [
      userMatchWhere,
      {
        Discussions_SOME: {
          DiscussionChannels_SOME: {
            channelUniqueName_IN: selectedChannels.value,
          },
        },
      },
    ],
  };
});

const {
  result: albumsResult,
  loading: albumsLoading,
  error: albumsError,
} = useQuery(
  GET_USER_ALBUMS,
  () => ({
    where: albumsWhere.value,
  }),
  () => ({
    enabled: !!username.value,
    fetchPolicy: 'cache-and-network',
  })
);

// Helper to get album date for sorting (use discussion createdAt or first image createdAt)
const getAlbumDate = (album: any): Date => {
  const discussionDate = album.Discussions?.[0]?.createdAt;
  const imageDate = album.Images?.[0]?.createdAt;
  const dateStr = discussionDate || imageDate;
  return dateStr ? new Date(dateStr) : new Date(0);
};

// Sort albums by newest first
const sortByNewest = (albums: any[]) => {
  return [...albums].sort((a, b) => {
    return getAlbumDate(b).getTime() - getAlbumDate(a).getTime();
  });
};

const allAlbums = computed(() => {
  if (albumsError.value) return [];
  return albumsResult.value?.albums || [];
});

// Albums where the user is the Owner (sorted newest first)
const ownedAlbums = computed(() => {
  const owned = allAlbums.value.filter(
    (album: any) => album.Owner?.username === username.value
  );
  return sortByNewest(owned);
});

// Albums where user uploaded images but is not the owner (sorted newest first)
const otherAlbums = computed(() => {
  const other = allAlbums.value.filter(
    (album: any) => album.Owner?.username !== username.value
  );
  return sortByNewest(other);
});

// Get first image from album for thumbnail
const getAlbumThumbnail = (album: any) => {
  if (album.imageOrder && album.imageOrder.length > 0 && album.Images) {
    const firstImageId = album.imageOrder[0];
    const firstImage = album.Images.find((img: any) => img.id === firstImageId);
    return firstImage?.url || album.Images[0]?.url || '';
  }
  return album.Images?.[0]?.url || '';
};

</script>

<template>
  <div class="p-4">
    <!-- Loading state -->
    <div v-if="albumsLoading && allAlbums.length === 0" class="flex h-48 items-center justify-center">
      <div class="text-lg text-gray-600 dark:text-gray-400">Loading albums...</div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="albumsError"
      class="flex h-48 flex-col items-center justify-center text-center"
    >
      <p class="text-gray-600 dark:text-gray-400">
        Error loading albums. Please try again.
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="allAlbums.length === 0"
      class="flex h-48 flex-col items-center justify-center text-center"
    >
      <p class="text-gray-600 dark:text-gray-400">
        {{ username }} hasn't created any albums yet.
      </p>
    </div>

    <!-- Albums sections -->
    <div v-else class="space-y-8">
      <!-- Owned Albums section -->
      <div v-if="ownedAlbums.length > 0">
        <h2 class="mb-4 text-lg font-semibold dark:text-white">
          Albums ({{ ownedAlbums.length }})
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="album in ownedAlbums"
            :key="album.id"
            :to="`/u/${username}/albums/${album.id}`"
            class="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video bg-gray-100 dark:bg-gray-800">
              <img
                v-if="getAlbumThumbnail(album)"
                :src="getAlbumThumbnail(album)"
                alt="Album thumbnail"
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
              >
              <div
                v-else
                class="flex h-full items-center justify-center text-gray-400"
              >
                No images
              </div>
              <!-- Image count badge -->
              <div class="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                {{ album.ImagesAggregate?.count || 0 }} images
              </div>
            </div>

            <!-- Album info -->
            <div class="p-3">
              <div v-if="album.Discussions?.[0]" class="text-sm">
                <span class="text-gray-500 dark:text-gray-400">From: </span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ album.Discussions[0].title }}
                </span>
              </div>
              <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                Standalone album
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Other Albums section (albums containing user's images but not owned by user) -->
      <div v-if="otherAlbums.length > 0">
        <h2 class="mb-4 text-lg font-semibold dark:text-white">
          Albums containing {{ username }}'s images ({{ otherAlbums.length }})
        </h2>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="album in otherAlbums"
            :key="album.id"
            :to="`/u/${username}/albums/${album.id}`"
            class="group overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
          >
            <!-- Thumbnail -->
            <div class="relative aspect-video bg-gray-100 dark:bg-gray-800">
              <img
                v-if="getAlbumThumbnail(album)"
                :src="getAlbumThumbnail(album)"
                alt="Album thumbnail"
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
              >
              <div
                v-else
                class="flex h-full items-center justify-center text-gray-400"
              >
                No images
              </div>
              <!-- Image count badge -->
              <div class="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                {{ album.ImagesAggregate?.count || 0 }} images
              </div>
            </div>

            <!-- Album info -->
            <div class="p-3">
              <div v-if="album.Discussions?.[0]" class="text-sm">
                <span class="text-gray-500 dark:text-gray-400">From: </span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ album.Discussions[0].title }}
                </span>
              </div>
              <div v-else class="text-sm text-gray-500 dark:text-gray-400">
                Standalone album
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
