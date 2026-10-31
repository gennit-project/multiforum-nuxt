<script setup lang="ts">
import type { GetUserFavoriteDownloadsQuery } from '@/__generated__/operations';
import { GetUserFavoriteDownloadsDocument as GET_USER_FAVORITE_DOWNLOADS } from '@/__generated__/operations';
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { useUsername } from '@/composables/useAuthState';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import LibraryListSkeleton from '@/components/library/LibraryListSkeleton.vue';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';

const usernameVar = useUsername();

type FavoriteDownload =
  GetUserFavoriteDownloadsQuery['users'][number]['FavoriteDiscussions'][number];

useHead({
  title: 'Favorite Downloads - Library',
});

const { result, loading, error } = useQuery(
  GET_USER_FAVORITE_DOWNLOADS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const favoriteDownloads = computed(() => {
  return result.value?.users?.[0]?.FavoriteDiscussions || [];
});
const { serverAdminUsernames } = useServerRoleMembership();

const getDownloadLink = (download: FavoriteDownload) => {
  const firstChannel = safeArrayFirst(download.DiscussionChannels);
  if (!firstChannel?.channelUniqueName) return '/';

  return `/forums/${firstChannel.channelUniqueName}/downloads/${download.id}`;
};

const getChannelLink = (channelUniqueName: string | undefined) => {
  if (!channelUniqueName) return '/';
  return `/forums/${channelUniqueName}`;
};

const getAuthorInfo = (download: FavoriteDownload) => {
  const author = download?.Author;
  if (!author) return null;

  const serverRoleBadge = getServerRoleBadge({
    username: author.username,
    adminUsernames: serverAdminUsernames.value,
  });

  return {
    username: author.username || '',
    displayName: author.displayName || '',
    profilePicURL: author.profilePicURL || '',
    commentKarma: author.commentKarma ?? 0,
    discussionKarma: author.discussionKarma ?? 0,
    createdAt: author.createdAt || '',
    isAdmin: serverRoleBadge === 'serverAdmin',
  };
};

const getFirstAlbumImage = (download: FavoriteDownload): string | undefined => {
  const album = download?.Album;
  if (!album?.Images?.length) return undefined;

  if ('imageOrder' in album && album.imageOrder?.length) {
    const firstImageId = album.imageOrder[0];
    const orderedImage = album.Images.find((img) => img.id === firstImageId);
    return orderedImage?.url || undefined;
  }

  return album.Images[0]?.url || undefined;
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
                Favorite Downloads
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite downloads and files.
              </p>
            </div>

            <LibraryListSkeleton
              v-if="loading"
              label="Loading your favorite downloads"
              variant="cards"
            />

            <div
              v-else-if="error"
              class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite downloads: {{ error.message }}
              </p>
            </div>

            <div
              v-else-if="favoriteDownloads.length === 0"
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
                No favorite downloads yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start adding downloads to your favorites to see them here.
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/downloads"
                  class="bg-brand-500 hover:bg-brand-600 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
                >
                  Browse Downloads
                </NuxtLink>
              </div>
            </div>

            <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LibraryDownloadCard
                v-for="download in favoriteDownloads"
                :key="download.id"
                :download="download"
                :download-link="getDownloadLink(download)"
                :channel-link="
                  getChannelLink(
                    download.DiscussionChannels?.[0]?.channelUniqueName
                  )
                "
                :channel-unique-name="
                  download.DiscussionChannels?.[0]?.channelUniqueName || ''
                "
                :author-info="getAuthorInfo(download)"
                :preview-image-url="getFirstAlbumImage(download)"
                :show-favorite-button="true"
                :is-favorited="true"
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
            Please sign in to view your favorite downloads.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
