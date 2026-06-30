<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { useUsername } from '@/composables/useAuthState';
import { gql } from '@apollo/client/core';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';
import { getServerRoleBadge } from '@/utils/serverRoleBadges';

const usernameVar = useUsername();

interface DiscussionChannel {
  id: string;
  channelUniqueName?: string;
}

interface AlbumImage {
  id: string;
  url?: string;
  caption?: string;
}

interface FavoriteDownload {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  updatedAt?: string;
  hasDownload?: boolean;
  hasSensitiveContent?: boolean;
  Author?: {
    username?: string;
    displayName?: string;
    profilePicURL?: string;
    commentKarma?: number;
    discussionKarma?: number;
    createdAt?: string;
  };
  DiscussionChannels?: DiscussionChannel[];
  Tags?: Array<{ text: string }>;
  Album?: {
    id: string;
    imageOrder?: string[];
    Images?: AlbumImage[];
  };
}

useHead({
  title: 'Favorite Downloads - Library',
});

const GET_USER_FAVORITE_DOWNLOADS = gql`
  query getUserFavoriteDownloads($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteDiscussions(
        where: { hasDownload: true }
        options: { sort: { createdAt: DESC } }
      ) {
        id
        title
        body
        createdAt
        updatedAt
        hasDownload
        Author {
          username
          displayName
          profilePicURL
          commentKarma
          discussionKarma
          createdAt
        }
        DiscussionChannels {
          id
          channelUniqueName
          archived
          answered
          locked
          weightedVotesCount
          Channel {
            uniqueName
            displayName
          }
          CommentsAggregate {
            count
          }
        }
        Tags {
          text
        }
        Album {
          id
          imageOrder
          Images {
            id
            url
            caption
          }
        }
        hasSensitiveContent
      }
    }
  }
`;

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
  const firstChannel = safeArrayFirst(download.DiscussionChannels) as
    | DiscussionChannel
    | undefined;
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
                Favorite Downloads
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite downloads and files.
              </p>
            </div>

            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite downloads...
              </p>
            </div>

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
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
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
                  getChannelLink(download.DiscussionChannels?.[0]?.channelUniqueName)
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
