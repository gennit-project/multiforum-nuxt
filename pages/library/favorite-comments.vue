<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@vue/apollo-composable';
import { gql } from '@apollo/client/core';
import { useHead } from 'nuxt/app';
import { useUsername } from '@/composables/useAuthState';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import {
  getCommentPermalink,
  getCommentContextPermalink,
  getCommentContextTitle,
  getCommentContextType,
  getCommentAuthorInfo,
} from '@/utils/commentUtils';
import { useServerRoleMembership } from '@/composables/useServerRoleMembership';

const usernameVar = useUsername();

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

const { serverAdminUsernames } = useServerRoleMembership();

const getFavoriteCommentAuthorInfo = (
  comment: Parameters<typeof getCommentAuthorInfo>[0]
) => {
  return getCommentAuthorInfo(comment, {
    serverAdminUsernames: serverAdminUsernames.value,
  });
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
                Favorite Comments
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Your collection of favorite comments and replies.
              </p>
            </div>

            <div v-if="loading" class="py-8 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
              />
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Loading your favorite comments...
              </p>
            </div>

            <div
              v-else-if="error"
              class="rounded-lg bg-red-50 p-4 dark:bg-red-900/20"
            >
              <p class="text-red-800 dark:text-red-300">
                Error loading favorite comments: {{ error.message }}
              </p>
            </div>

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

            <div v-else class="space-y-4">
              <LibraryCommentCard
                v-for="comment in favoriteComments"
                :key="comment.id"
                :comment="comment"
                :author-info="getFavoriteCommentAuthorInfo(comment)"
                :context-type="getCommentContextType(comment)"
                :context-title="getCommentContextTitle(comment)"
                :context-permalink="getCommentContextPermalink(comment)"
                :permalink="getCommentPermalink(comment)"
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
            Please sign in to view your favorite comments.
          </p>
        </div>
      </template>
    </RequireAuth>
  </div>
</template>
