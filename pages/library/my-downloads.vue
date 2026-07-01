<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { useUsername } from '@/composables/useAuthState';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import type { Discussion } from '@/__generated__/graphql';
import {
  GET_ALL_USER_COLLECTIONS,
  GET_COLLECTION_ITEMS,
} from '@/graphQLData/collection/queries';
import { GET_USER_OWNED_DOWNLOADS } from '@/graphQLData/user/queries';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import {
  getDownloadLink,
  getChannelLink,
  buildFavoriteAuthorInfo,
} from '@/utils/favoriteDiscussionDisplay';
import {
  AUTO_SAVED_DOWNLOADS_COLLECTION_NAME,
  isAutoSavedDownloadsCollection,
} from '@/utils/downloadLibraryCollection';

const usernameVar = useUsername();

interface AlbumImage {
  id: string;
  url?: string;
}

type Download = Pick<Discussion, 'id' | 'title' | 'createdAt' | 'Tags'> & {
  isFavorited?: boolean;
  DiscussionChannels?: Array<{ channelUniqueName?: string }>;
  Author?: {
    username?: string;
    displayName?: string;
    profilePicURL?: string;
    commentKarma?: number;
    discussionKarma?: number;
    createdAt?: string;
  };
  Album?: {
    Images?: AlbumImage[];
    imageOrder?: string[];
  };
};

useHead({
  title: 'My Downloads - Library',
});

const {
  result: collectionsResult,
  loading: collectionsLoading,
  error: collectionsError,
} = useQuery(
  GET_ALL_USER_COLLECTIONS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const downloadsCollection = computed(() => {
  const collections = collectionsResult.value?.users?.[0]?.Collections || [];
  return collections.find((collection) => isAutoSavedDownloadsCollection(collection));
});

const {
  result: collectionItemsResult,
  loading: collectionItemsLoading,
  error: collectionItemsError,
} = useQuery(
  GET_COLLECTION_ITEMS,
  () => ({
    collectionId: downloadsCollection.value?.id,
    loggedInUsername: usernameVar.value,
  }),
  () => ({
    enabled: !!downloadsCollection.value?.id,
  })
);

const { result, loading, error } = useQuery(
  GET_USER_OWNED_DOWNLOADS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value && !downloadsCollection.value,
  })
);

const ownedDownloads = computed(() => {
  return result.value?.users?.[0]?.OwnedDownloads || [];
});

const downloadsFromCollection = computed(() => {
  return collectionItemsResult.value?.collections?.[0]?.Downloads || [];
});

const downloads = computed(() => {
  if (downloadsCollection.value) {
    return downloadsFromCollection.value;
  }

  return ownedDownloads.value;
});

const loadingState = computed(() => {
  return collectionsLoading.value || collectionItemsLoading.value || loading.value;
});

const errorState = computed(() => {
  return collectionsError.value || collectionItemsError.value || error.value;
});

const pageIntro = computed(() => {
  return downloadsCollection.value
    ? 'Downloads are added here automatically when you grab a file, with links back to the source.'
    : 'All the downloads you have saved, with links back to the source.';
});

const emptyStateCopy = computed(() => {
  return downloadsCollection.value
    ? 'Download a file and it will appear here automatically.'
    : 'Your downloads will appear here once you grab a file.';
});
const { serverAdminUsernames } = useServerRoleMembership();

const getAuthorInfo = (download: Download) =>
  buildFavoriteAuthorInfo({
    author: download?.Author,
    adminUsernames: serverAdminUsernames.value,
  });

const getFirstAlbumImage = (download: Download): string | undefined => {
  const album = download?.Album;
  if (!album?.Images?.length) return undefined;

  if (album.imageOrder?.length && album.imageOrder.length > 0) {
    const firstImageId = album.imageOrder[0];
    const orderedImage = album.Images.find(
      (img: AlbumImage) => img.id === firstImageId
    );
    return orderedImage?.url;
  }

  return album.Images[0]?.url;
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                My Downloads
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                {{ pageIntro }}
              </p>
              <p
                v-if="downloadsCollection"
                class="mt-2 text-sm text-gray-500 dark:text-gray-400"
              >
                Saved in your private
                <span class="font-medium">{{ AUTO_SAVED_DOWNLOADS_COLLECTION_NAME }}</span>
                collection.
              </p>
            </div>

            <div v-if="loadingState" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your downloads...
              </p>
            </div>

            <div
              v-else-if="errorState"
              class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading downloads: {{ errorState.message }}
              </p>
            </div>

            <div
              v-else-if="downloads.length === 0"
              class="py-12 text-center"
            >
              <svg
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <h3
                class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                No downloads yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ emptyStateCopy }}
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/downloads"
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
                >
                  Browse Downloads
                </NuxtLink>
              </div>
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LibraryDownloadCard
                v-for="download in downloads"
                :key="download.id"
                :download="download"
                :download-link="getDownloadLink(download)"
                :channel-link="
                  getChannelLink(download.DiscussionChannels?.[0]?.channelUniqueName)
                "
                :channel-unique-name="
                  download.DiscussionChannels?.[0]?.channelUniqueName || ''
                "
                :author-info="getAuthorInfo(download)"
                :preview-image-url="getFirstAlbumImage(download)"
                :show-favorite-button="true"
                :is-favorited="Boolean(download.isFavorited)"
              />
            </div>
          </div>
        </div>
      </template>
      <template #does-not-have-auth>
        <div class="mx-auto max-w-md py-12 text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In Required
          </h1>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Please sign in to view your downloads.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
