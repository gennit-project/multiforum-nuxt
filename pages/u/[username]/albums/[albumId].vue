<script lang="ts" setup>
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useHead } from 'nuxt/app';
import { GET_ALBUM_DETAILS } from '@/graphQLData/image/queries';
import type { Album, Image } from '@/__generated__/graphql';
import AlbumThumbnailGrid from '@/components/album/AlbumThumbnailGrid.vue';

// @ts-ignore - definePageMeta is auto-imported by Nuxt
definePageMeta({
  ssr: false,
});

const route = useRoute();

const username = computed(() => {
  return typeof route.params.username === 'string' ? route.params.username : '';
});

const albumId = computed(() => {
  return typeof route.params.albumId === 'string' ? route.params.albumId : '';
});

const {
  result: albumResult,
  loading: albumLoading,
  error: albumError,
} = useQuery(
  GET_ALBUM_DETAILS,
  () => ({
    albumId: albumId.value,
  }),
  () => ({
    enabled: !!albumId.value,
    fetchPolicy: 'network-only',
  })
);

const album = computed((): Album | null => {
  if (albumError.value) return null;
  if (albumResult.value && albumResult.value.albums.length > 0) {
    return albumResult.value.albums[0];
  }
  return null;
});

// Get owner from album.Owner or fall back to first image's uploader
const owner = computed(() => {
  if (album.value?.Owner) {
    return album.value.Owner;
  }
  // Fall back to first image's uploader
  const firstImage = album.value?.Images?.[0];
  return firstImage?.Uploader || null;
});

// Check if the current user matches the username in the route
// If we can't determine the owner, trust the URL
const isCorrectUserPage = computed(() => {
  if (!owner.value?.username) {
    return true; // Trust the URL if we can't determine owner
  }
  return owner.value.username === username.value;
});

// Order images according to imageOrder array
const orderedImages = computed((): Image[] => {
  if (!album.value?.Images) return [];

  const images = album.value.Images;
  const imageOrder = album.value.imageOrder;

  if (!imageOrder || imageOrder.length === 0) {
    return images;
  }

  return imageOrder
    .map((imageId) => images.find((img) => img.id === imageId))
    .filter((img): img is Image => img !== undefined);
});

// Get the first discussion for this album (if any)
const discussion = computed(() => {
  return album.value?.Discussions?.[0] || null;
});

// SEO metadata
useHead({
  title: computed(() => {
    if (!album.value) {
      return 'Album Not Found';
    }
    const ownerName = owner.value?.displayName || owner.value?.username || username.value;
    return `Album by ${ownerName}`;
  }),
});
</script>

<template>
  <ClientOnly>
    <div class="mx-auto max-w-4xl px-4 py-8">
      <!-- Loading state -->
      <div v-if="albumLoading" class="flex h-96 items-center justify-center">
        <div class="text-lg">Loading album...</div>
      </div>

      <!-- Error state -->
      <div
        v-else-if="albumError || !album"
        class="flex h-96 flex-col items-center justify-center text-center"
      >
        <h1 class="mb-4 text-2xl font-bold">Album Not Found</h1>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          The album you're looking for doesn't exist or has been removed.
        </p>
        <NuxtLink
          :to="`/u/${username}/images`"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Images
        </NuxtLink>
      </div>

      <!-- Wrong user page -->
      <div
        v-else-if="!isCorrectUserPage"
        class="flex h-96 flex-col items-center justify-center text-center"
      >
        <h1 class="mb-4 text-2xl font-bold">Invalid URL</h1>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          This album belongs to {{ owner?.username }}, not {{ username }}.
        </p>
        <NuxtLink
          :to="`/u/${owner?.username}/albums/${albumId}`"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View on Correct Profile
        </NuxtLink>
      </div>

      <!-- Main content -->
      <div v-else class="space-y-6">
        <h1 class="text-2xl font-bold dark:text-white">
          Album by {{ owner?.displayName || owner?.username || username }}
          <span v-if="owner?.displayName && owner?.username" class="text-gray-500 dark:text-gray-400">
            ({{ owner.username }})
          </span>
        </h1>

        <!-- Header with navigation -->
        <div class="flex items-center justify-between">
          <NuxtLink
            :to="`/u/${username}/images`"
            class="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            &larr; Back to {{ username }}'s Images
          </NuxtLink>
        </div>

        <!-- Related discussion -->
        <div
          v-if="discussion"
          class="rounded-lg border bg-white p-6 dark:bg-gray-900"
        >
          <h2 class="font-semibold mb-3 text-lg dark:text-gray-300">
            Related Discussion
          </h2>
          <NuxtLink
            :to="`/forums/${discussion.DiscussionChannels?.[0]?.channelUniqueName}/discussions/${discussion.id}`"
            class="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {{ discussion.title }}
          </NuxtLink>
          <div class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            by {{ discussion.Author?.displayName || discussion.Author?.username }}
            <span v-if="discussion.createdAt">
              &middot; {{ new Date(discussion.createdAt).toLocaleDateString() }}
            </span>
          </div>
        </div>

        <!-- Image thumbnails grid -->
        <div class="rounded-lg border bg-white p-6 dark:bg-gray-900">
          <h2 class="font-semibold mb-4 text-lg dark:text-gray-300">
            Images ({{ orderedImages.length }})
          </h2>
          <AlbumThumbnailGrid :images="orderedImages" />
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
