<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { GET_WIKI_PAGE } from '@/graphQLData/channel/queries';
import { useQuery } from '@vue/apollo-composable';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { timeAgo } from '@/utils';
import type { WikiPage, TextVersion } from '@/__generated__/graphql';
import {
  buildSequentialRevisionPairs,
  getRevisionAuthorName,
  type RevisionPair,
} from '@/utils/revisionHistory';

type WikiRevisionData = RevisionPair<TextVersion>;
type WikiPageWithEditReason = WikiPage & { editReason?: string | null };

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const slug = route.params.slug as string;

// Query wiki page data for the specific slug
const {
  result: wikiPageResult,
  loading,
  error,
} = useQuery(
  GET_WIKI_PAGE,
  {
    channelUniqueName: forumId,
    slug: slug,
  },
  { errorPolicy: 'all' }
);

// Computed property for the wiki page data
const wikiPage = computed(() => wikiPageResult.value?.wikiPages[0] as WikiPage);

// Total number of edits
const totalEdits = computed(() => {
  return wikiPage.value?.PastVersions?.length || 0;
});

// Check if there are any edits to show (need at least 1 past version, meaning it has been edited)
const hasEdits = computed(() => {
  return totalEdits.value >= 1;
});

// Process all versions and sort by timestamp (newest first)
const allEdits = computed(() => {
  if (!wikiPage.value) {
    return [];
  }

  const currentVersion: TextVersion = {
    id: 'current',
    body: wikiPage.value.body,
    editReason: (wikiPage.value as WikiPageWithEditReason).editReason,
    createdAt: wikiPage.value.updatedAt || wikiPage.value.createdAt,
    Author: wikiPage.value.VersionAuthor,
    AuthorConnection: {
      edges: [],
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      totalCount: 0,
    },
  };

  return buildSequentialRevisionPairs({
    pastVersions: wikiPage.value.PastVersions,
    currentVersion,
    currentAuthor: wikiPage.value.VersionAuthor,
    skipUnchangedCurrent: true,
    getHistoricalPairAuthor: ({ oldVersion }) =>
      getRevisionAuthorName(oldVersion.Author),
  });
});

const getRevisionReason = (edit: WikiRevisionData) => {
  return edit.newVersionData.editReason || edit.oldVersionData.editReason || '';
};

// Navigate to revision detail page
const viewRevisionDiff = (revision: WikiRevisionData) => {
  try {
    router.push(
      `/forums/${forumId}/wiki/revisions/diff/${slug}/${revision.id}`
    );
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// Navigate back to wiki page
const goBackToWiki = () => {
  router.push(`/forums/${forumId}/wiki/${slug}`);
};

// SEO metadata setup
useHead({
  title: `Revision History - ${wikiPage.value?.title || 'Wiki Page'} | ${forumId}`,
  meta: [
    {
      name: 'description',
      content: `View revision history for the ${wikiPage.value?.title || 'wiki page'}.`,
    },
    { name: 'robots', content: 'noindex' }, // Don't index revision pages
  ],
});
</script>

<template>
  <div class="mx-auto p-4">
    <div v-if="loading" class="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="error"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki page revisions.</p>
      <p class="mt-2 text-sm">{{ error?.message }}</p>
    </div>

    <div
      v-else-if="!wikiPage"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p class="mb-4 text-lg">This wiki page doesn't exist.</p>
      <button
        class="text-blue-600 hover:underline dark:text-blue-400"
        @click="goBackToWiki"
      >
        Go back
      </button>
    </div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="border-b border-gray-200 pb-4 dark:border-gray-700">
        <nav class="mb-4" aria-label="Wiki revisions breadcrumb">
          <button
            class="text-orange-600 hover:underline dark:text-orange-400"
            @click="goBackToWiki"
          >
            ← Back to {{ wikiPage.title }}
          </button>
        </nav>

        <h1 class="text-2xl font-bold dark:text-white">
          Revision History For Wiki Page
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          "{{ wikiPage.title }}" has been edited {{ totalEdits }} time{{
            totalEdits !== 1 ? 's' : ''
          }}
        </p>
      </div>

      <!-- No edits message -->
      <div v-if="!hasEdits" class="py-8 text-center">
        <p class="text-gray-500 dark:text-gray-400">
          This page has not been edited yet.
        </p>
        <button
          class="mt-2 text-blue-600 hover:underline dark:text-blue-400"
          @click="goBackToWiki"
        >
          Go back to wiki page
        </button>
      </div>

      <!-- Revisions list -->
      <div v-else class="space-y-2">
        <div
          v-for="edit in allEdits"
          :key="edit.id"
          class="hover:bg-gray-50 cursor-pointer rounded-md border border-gray-200 px-3 py-2 transition-colors dark:border-gray-700 dark:hover:bg-gray-800/50"
          @click="
            () => {
              viewRevisionDiff(edit);
            }
          "
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <div
                class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm"
              >
                <div class="font-medium text-gray-900 dark:text-gray-100">
                  {{ edit.author }}
                </div>
                <div class="text-gray-500 dark:text-gray-400">
                  {{ timeAgo(new Date(edit.createdAt)) }}
                </div>
                <div
                  v-if="edit.isCurrent"
                  class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200"
                >
                  Most recent edit
                </div>
              </div>
              <div class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                {{
                  new Date(edit.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })
                }}
              </div>
              <div
                v-if="getRevisionReason(edit)"
                class="mt-1 text-xs text-gray-600 dark:text-gray-400"
              >
                <span class="font-semibold text-gray-700 dark:text-gray-200"
                  >Edit reason:</span
                >
                {{ getRevisionReason(edit) }}
              </div>
            </div>
            <div
              class="flex items-center text-sm text-gray-400 dark:text-gray-500"
            >
              <i class="fas fa-chevron-right" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
