<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { useHead } from 'nuxt/app';
import { usernameVar } from '@/cache';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import TagComponent from '@/components/TagComponent.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import { GET_USER_OWNED_DOWNLOADS } from '@/graphQLData/user/queries';
import { relativeTime } from '@/utils';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';

useHead({
  title: 'My Downloads - Library',
});

const { result, loading, error } = useQuery(
  GET_USER_OWNED_DOWNLOADS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const ownedDownloads = computed(() => {
  return result.value?.users?.[0]?.OwnedDownloads || [];
});

const getDownloadLink = (download: any) => {
  const firstChannel = safeArrayFirst(download.DiscussionChannels) as any;
  if (!firstChannel?.channelUniqueName) return '/';

  return `/forums/${firstChannel.channelUniqueName}/downloads/${download.id}`;
};

const getChannelLink = (channelUniqueName: string | undefined) => {
  if (!channelUniqueName) return '/';
  return `/forums/${channelUniqueName}`;
};

const getAuthorInfo = (download: any) => {
  const author = download?.Author;
  if (!author) return null;

  return {
    username: author.username || '',
    displayName: author.displayName || '',
    profilePicURL: author.profilePicURL || '',
    commentKarma: author.commentKarma ?? 0,
    discussionKarma: author.discussionKarma ?? 0,
    createdAt: author.createdAt || '',
    isAdmin: author.ServerRoles?.[0]?.showAdminTag || false,
  };
};

const getFirstAlbumImage = (download: any) => {
  const album = download?.Album;
  if (!album?.Images?.length) return null;

  if (album.imageOrder?.length && album.imageOrder.length > 0) {
    const firstImageId = album.imageOrder[0];
    const orderedImage = album.Images.find(
      (img: any) => img.id === firstImageId
    );
    return orderedImage?.url || null;
  }

  return album.Images[0]?.url || null;
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
                All the downloads you have saved, with links back to the source.
              </p>
            </div>

            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your downloads...
              </p>
            </div>

            <div
              v-else-if="error"
              class="bg-red-50 rounded-lg p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading downloads: {{ error.message }}
              </p>
            </div>

            <div
              v-else-if="ownedDownloads.length === 0"
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
                Your downloads will appear here once you grab a file.
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
              <div
                v-for="download in ownedDownloads"
                :key="download.id"
                class="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <NuxtLink
                  :to="getDownloadLink(download)"
                  class="block aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700"
                >
                  <img
                    v-if="getFirstAlbumImage(download)"
                    :src="getFirstAlbumImage(download)"
                    :alt="download.title"
                    class="h-full w-full object-cover"
                  >
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center text-gray-400"
                  >
                    <svg
                      class="h-12 w-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </NuxtLink>

                <div class="p-4">
                  <div class="mb-2 flex items-center justify-between">
                    <NuxtLink
                      v-if="download.DiscussionChannels?.[0]"
                      :to="
                        getChannelLink(
                          download.DiscussionChannels[0].channelUniqueName
                        )
                      "
                      class="flex items-center text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    >
                      <AvatarComponent
                        :text="download.DiscussionChannels[0].channelUniqueName"
                        :is-square="true"
                        class="mr-1 h-4 w-4"
                      />
                      <span>{{
                        download.DiscussionChannels[0].channelUniqueName
                      }}</span>
                    </NuxtLink>

                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ relativeTime(download.createdAt) }}
                    </span>
                  </div>

                  <div class="mb-2 flex items-center justify-between">
                    <NuxtLink
                      :to="getDownloadLink(download)"
                      class="font-semibold min-w-0 flex-1 text-base text-gray-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                    >
                      {{ download.title }}
                    </NuxtLink>
                    <div class="ml-2 flex-shrink-0">
                      <AddToDiscussionFavorites
                        :allow-add-to-list="false"
                        :discussion-id="download.id"
                        :discussion-title="download.title"
                        entity-name="Download"
                        size="small"
                      />
                    </div>
                  </div>

                  <div
                    class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
                  >
                    <div class="flex items-center">
                      <span class="mr-1">by</span>
                      <UsernameWithTooltip
                        v-if="getAuthorInfo(download)"
                        :username="getAuthorInfo(download)!.username"
                        :display-name="getAuthorInfo(download)!.displayName"
                        :src="getAuthorInfo(download)!.profilePicURL"
                        :is-admin="getAuthorInfo(download)!.isAdmin"
                        :comment-karma="getAuthorInfo(download)!.commentKarma"
                        :discussion-karma="
                          getAuthorInfo(download)!.discussionKarma
                        "
                        :account-created="getAuthorInfo(download)!.createdAt"
                      />
                      <span v-else>Deleted</span>
                    </div>
                  </div>

                  <div
                    v-if="download.Tags && download.Tags.length > 0"
                    class="mt-3 flex flex-wrap gap-1"
                  >
                    <TagComponent
                      v-for="tag in download.Tags.slice(0, 3)"
                      :key="tag.text"
                      :tag="tag.text"
                      class="text-xs"
                      @click.prevent=""
                    />
                    <span
                      v-if="download.Tags.length > 3"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      +{{ download.Tags.length - 3 }} more
                    </span>
                  </div>
                </div>
              </div>
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
