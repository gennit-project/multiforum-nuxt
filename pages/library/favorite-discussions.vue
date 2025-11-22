<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import { useHead } from 'nuxt/app';
import { usernameVar } from '@/cache';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import TagComponent from '@/components/TagComponent.vue';
import AddToDiscussionFavorites from '@/components/favorites/AddToDiscussionFavorites.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { relativeTime } from '@/utils';
import { safeArrayFirst } from '@/utils/ssrSafetyUtils';

// Lazy load the album component since it's not needed for initial render
const DiscussionAlbum = defineAsyncComponent(
  () => import('@/components/discussion/detail/DiscussionAlbum.vue')
);

useHead({
  title: 'Favorite Discussions - Library',
});

// We need to create a new query that filters out downloads
const GET_USER_FAVORITE_DISCUSSIONS_NO_DOWNLOADS = gql`
  query getUserFavoriteDiscussionsNoDownloads($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteDiscussions(
        where: { OR: [{ hasDownload: false }, { hasDownload: null }] }
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
          ServerRoles {
            showAdminTag
          }
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
  GET_USER_FAVORITE_DISCUSSIONS_NO_DOWNLOADS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const favoriteDiscussions = computed(() => {
  return result.value?.users?.[0]?.FavoriteDiscussions || [];
});

const formatCount = (
  count: number | undefined,
  singular: string,
  plural: string
) => {
  const value = count || 0;
  return `${value} ${value === 1 ? singular : plural}`;
};

const getDiscussionLink = (discussion: any) => {
  const firstChannel = safeArrayFirst(discussion.DiscussionChannels) as any;
  if (!firstChannel?.channelUniqueName) return '/';

  return `/forums/${firstChannel.channelUniqueName}/discussions/${discussion.id}`;
};

const getChannelLink = (channelUniqueName: string | undefined) => {
  if (!channelUniqueName) return '/';
  return `/forums/${channelUniqueName}`;
};

const getTotalCommentCount = (discussionChannels: any[]) => {
  return discussionChannels.reduce((total, dc) => {
    return total + (dc.CommentsAggregate?.count || 0);
  }, 0);
};

const getAuthorInfo = (discussion: any) => {
  const author = discussion?.Author;
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
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black dark:text-white">
    <RequireAuth>
      <template #has-auth>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <!-- Header with back button -->
            <div class="mb-8">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Favorite Discussions
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite discussions and posts.
              </p>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite discussions...
              </p>
            </div>

            <!-- Error state -->
            <div
              v-else-if="error"
              class="bg-red-50 rounded-lg p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite discussions: {{ error.message }}
              </p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="favoriteDiscussions.length === 0"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3
                class="mt-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                No favorite discussions yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start adding discussions to your favorites to see them here.
              </p>
              <div class="mt-6">
                <NuxtLink
                  to="/"
                  class="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600"
                >
                  Browse Discussions
                </NuxtLink>
              </div>
            </div>

            <!-- Discussions list -->
            <div v-else class="space-y-4">
              <div
                v-for="discussion in favoriteDiscussions"
                :key="discussion.id"
                class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <!-- Discussion header -->
                <div class="mb-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <!-- Channel info -->
                      <NuxtLink
                        v-if="discussion.DiscussionChannels?.[0]"
                        :to="
                          getChannelLink(
                            discussion.DiscussionChannels[0].channelUniqueName
                          )
                        "
                        class="flex items-center text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        <AvatarComponent
                          :text="
                            discussion.DiscussionChannels[0].channelUniqueName
                          "
                          :is-square="true"
                          class="mr-2 h-5 w-5"
                        />
                        <span>{{
                          discussion.DiscussionChannels[0].channelUniqueName
                        }}</span>
                      </NuxtLink>

                      <!-- Sensitive content indicator -->
                      <span
                        v-if="discussion.hasSensitiveContent"
                        class="rounded-full border border-orange-600 px-2 py-1 text-xs text-orange-600 dark:border-orange-400 dark:text-orange-400"
                      >
                        Sensitive
                      </span>
                    </div>

                    <!-- Date -->
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {{ relativeTime(discussion.createdAt) }}
                    </span>
                  </div>
                </div>

                <!-- Discussion title -->
                <div class="mb-3 flex items-center justify-between">
                  <NuxtLink
                    :to="getDiscussionLink(discussion)"
                    class="font-semibold min-w-0 flex-1 text-lg text-gray-900 hover:text-orange-600 dark:text-white dark:hover:text-orange-400"
                  >
                    {{ discussion.title }}
                  </NuxtLink>
                  <div class="ml-4 flex-shrink-0">
                    <AddToDiscussionFavorites
                      :allow-add-to-list="false"
                      :discussion-id="discussion.id"
                      :discussion-title="discussion.title"
                      size="medium"
                    />
                  </div>
                </div>

                <!-- Discussion preview -->
                <div v-if="discussion.body" class="mb-4">
                  <div
                    class="line-clamp-3 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <MarkdownRenderer
                      :text="discussion.body"
                      font-size="small"
                    />
                  </div>
                </div>

                <!-- Album -->
                <div
                  v-if="discussion.Album && discussion.Album?.Images.length > 0"
                  class="mb-4 max-w-full overflow-x-auto bg-black"
                >
                  <DiscussionAlbum
                    :album="discussion.Album"
                    :discussion-id="discussion.id"
                    :discussion-author="
                      getAuthorInfo(discussion)?.username || 'Deleted'
                    "
                    :carousel-format="true"
                    :show-edit-album="false"
                  />
                </div>

                <!-- Meta information -->
                <div class="flex items-center justify-between">
                  <div
                    class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <!-- Author -->
                    <div class="flex items-center">
                      <span class="mr-1">by</span>
                      <UsernameWithTooltip
                        v-if="getAuthorInfo(discussion)"
                        :username="getAuthorInfo(discussion)!.username"
                        :display-name="getAuthorInfo(discussion)!.displayName"
                        :src="getAuthorInfo(discussion)!.profilePicURL"
                        :is-admin="getAuthorInfo(discussion)!.isAdmin"
                        :comment-karma="getAuthorInfo(discussion)!.commentKarma"
                        :discussion-karma="
                          getAuthorInfo(discussion)!.discussionKarma
                        "
                        :account-created="getAuthorInfo(discussion)!.createdAt"
                      />
                      <span v-else>Deleted</span>
                    </div>

                    <!-- Comment count -->
                    <NuxtLink
                      :to="getDiscussionLink(discussion)"
                      class="flex items-center hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <i class="fa-regular fa-comment mr-1" />
                      {{
                        formatCount(
                          getTotalCommentCount(discussion.DiscussionChannels),
                          'comment',
                          'comments'
                        )
                      }}
                    </NuxtLink>

                    <!-- Multiple channels indicator -->
                    <span
                      v-if="discussion.DiscussionChannels.length > 1"
                      class="text-xs"
                    >
                      in {{ discussion.DiscussionChannels.length }} forums
                    </span>
                  </div>
                </div>

                <!-- Tags -->
                <div
                  v-if="discussion.Tags && discussion.Tags.length > 0"
                  class="mt-4 flex flex-wrap gap-2"
                >
                  <TagComponent
                    v-for="tag in discussion.Tags.slice(0, 5)"
                    :key="tag.text"
                    :tag="tag.text"
                    class="text-xs"
                    @click.prevent=""
                  />
                  <span
                    v-if="discussion.Tags.length > 5"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    +{{ discussion.Tags.length - 5 }} more
                  </span>
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
            Please sign in to view your favorite discussions.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
