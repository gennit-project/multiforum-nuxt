<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import { useHead } from 'nuxt/app';
import { usernameVar } from '@/cache';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import UsernameWithTooltip from '@/components/UsernameWithTooltip.vue';
import AddToCommentFavorites from '@/components/favorites/AddToCommentFavorites.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import { relativeTime } from '@/utils';
import {
  getCommentPermalink,
  getCommentContextPermalink,
  getCommentContextTitle,
  getCommentContextType,
  getCommentAuthorInfo,
} from '@/utils/commentUtils';

useHead({
  title: 'Favorite Comments - Library',
});

const GET_USER_FAVORITE_COMMENTS = gql`
  query getUserFavoriteComments($username: String!) {
    users(where: { username: $username }) {
      username
      FavoriteComments(options: { sort: { createdAt: DESC } }) {
        id
        text
        createdAt
        updatedAt
        CommentAuthor {
          ... on User {
            __typename
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
          ... on ModerationProfile {
            __typename
            displayName
          }
        }
        DiscussionChannel {
          id
          discussionId
          channelUniqueName
          Channel {
            uniqueName
            displayName
          }
          Discussion {
            id
            title
            hasDownload
          }
        }
        Channel {
          uniqueName
          displayName
        }
        Event {
          id
          title
        }
      }
    }
  }
`;

const { result, loading, error } = useQuery(
  GET_USER_FAVORITE_COMMENTS,
  () => ({
    username: usernameVar.value,
  }),
  () => ({
    enabled: !!usernameVar.value,
  })
);

const favoriteComments = computed(() => {
  return result.value?.users?.[0]?.FavoriteComments || [];
});

// Comment utility functions are imported from utils/commentUtils.ts
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
                Favorite Comments
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite comments and replies.
              </p>
            </div>

            <!-- Loading state -->
            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite comments...
              </p>
            </div>

            <!-- Error state -->
            <div
              v-else-if="error"
              class="bg-red-50 rounded-lg p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite comments: {{ error.message }}
              </p>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="favoriteComments.length === 0"
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
                No favorite comments yet
              </h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start adding comments to your favorites to see them here.
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

            <!-- Comments list -->
            <div v-else class="space-y-4">
              <div
                v-for="comment in favoriteComments"
                :key="comment.id"
                class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <!-- Comment header -->
                <div class="mb-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <!-- Context info -->
                      <NuxtLink
                        :to="getCommentContextPermalink(comment)"
                        class="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        {{ getCommentContextType(comment) }}:
                        {{ getCommentContextTitle(comment) }}
                      </NuxtLink>
                    </div>

                    <!-- Date -->
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {{ relativeTime(comment.createdAt) }}
                    </span>
                  </div>
                </div>

                <!-- Comment content -->
                <div class="mb-4">
                  <NuxtLink :to="getCommentPermalink(comment)" class="block">
                    <div class="prose prose-sm max-w-none dark:prose-invert">
                      <MarkdownRenderer
                        :text="comment.text"
                        font-size="small"
                      />
                    </div>
                  </NuxtLink>
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
                        v-if="
                          getCommentAuthorInfo(comment) &&
                          !getCommentAuthorInfo(comment)!.isModerationProfile
                        "
                        :username="getCommentAuthorInfo(comment)!.username"
                        :display-name="
                          getCommentAuthorInfo(comment)!.displayName
                        "
                        :src="getCommentAuthorInfo(comment)!.profilePicURL"
                        :is-admin="getCommentAuthorInfo(comment)!.isAdmin"
                        :comment-karma="
                          getCommentAuthorInfo(comment)!.commentKarma
                        "
                        :discussion-karma="
                          getCommentAuthorInfo(comment)!.discussionKarma
                        "
                        :account-created="
                          getCommentAuthorInfo(comment)!.createdAt
                        "
                      />
                      <span
                        v-else-if="
                          getCommentAuthorInfo(comment) &&
                          getCommentAuthorInfo(comment)!.isModerationProfile
                        "
                        class="text-orange-600 dark:text-orange-400"
                      >
                        {{ getCommentAuthorInfo(comment)!.displayName }}
                        (Moderator)
                      </span>
                      <span v-else>Deleted</span>
                    </div>

                    <!-- Comment link -->
                    <NuxtLink
                      :to="getCommentPermalink(comment)"
                      class="flex items-center hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <i class="fa-regular fa-comment mr-1" />
                      View Comment
                    </NuxtLink>
                  </div>

                  <div class="flex-shrink-0">
                    <AddToCommentFavorites
                      :allow-add-to-list="false"
                      :comment-id="comment.id"
                      :is-favorited="true"
                      size="medium"
                    />
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
            Please sign in to view your favorite comments.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
