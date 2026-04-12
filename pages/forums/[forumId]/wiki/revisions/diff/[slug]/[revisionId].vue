<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { GET_WIKI_PAGE } from '@/graphQLData/channel/queries';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { DELETE_WIKI_REVISION } from '@/graphQLData/discussion/mutations';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import RevisionDiffContent from '@/components/revision/RevisionDiffContent.vue';
import type { WikiPage, TextVersion } from '@/__generated__/graphql';
import {
  buildSequentialRevisionPairs,
  getRevisionAuthorName,
} from '@/utils/revisionHistory';

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const slug = route.params.slug as string;
const revisionId = route.params.revisionId as string;

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

// Process all versions to find the specific revision
const allEdits = computed(() => {
  if (!wikiPage.value) {
    return [];
  }

  const currentVersion: TextVersion = {
    id: 'current',
    body: wikiPage.value.body,
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

// Find the specific revision
const currentRevision = computed(() => {
  return allEdits.value.find((edit) => edit.id === revisionId);
});

// Deletion state
const isDeleting = ref(false);

// Set up delete mutation
const {
  mutate: deleteTextVersion,
  loading: deleteLoading,
  error: deleteError,
  onDone,
} = useMutation(DELETE_WIKI_REVISION);

onDone(() => {
  isDeleting.value = false;
  // Navigate back to revision history
  router.push(`/forums/${forumId}/wiki/revisions/${slug}`);
});

const handleDelete = async () => {
  if (!currentRevision.value?.oldVersionData?.id) return;

  if (
    confirm(
      'Are you sure you want to redact this revision? This action cannot be undone.'
    )
  ) {
    isDeleting.value = true;
    try {
      await deleteTextVersion({
        textVersionId: currentRevision.value.oldVersionData.id,
      });
    } catch (err) {
      console.error('Error deleting revision:', err);
      isDeleting.value = false;
    }
  }
};

// Navigation functions
const goBackToRevisions = () => {
  router.push(`/forums/${forumId}/wiki/revisions/${slug}`);
};

const goBackToWiki = () => {
  router.push(`/forums/${forumId}/wiki/${slug}`);
};

// SEO metadata setup
useHead({
  title: `Revision Detail - ${wikiPage.value?.title || 'Wiki Page'} | ${forumId}`,
  meta: [
    {
      name: 'description',
      content: `View revision details for the ${wikiPage.value?.title || 'wiki page'}.`,
    },
    { name: 'robots', content: 'noindex' }, // Don't index revision pages
  ],
});
</script>

<template>
  <div class="mx-auto max-w-full p-4">
    <div v-if="loading" class="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="error"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki page revision.</p>
      <p class="mt-2 text-sm">{{ error?.message }}</p>
    </div>

    <div
      v-else-if="!wikiPage || !currentRevision"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p class="mb-4 text-lg">This revision doesn't exist.</p>
      <button
        class="text-blue-600 hover:underline dark:text-blue-400"
        @click="goBackToRevisions"
      >
        Go back to revision history
      </button>
    </div>

    <div v-else class="space-y-6">
      <!-- Header -->
      <div class="border-b border-gray-200 pb-4 dark:border-gray-700">
        <nav
          class="mb-4 flex items-center space-x-2 text-sm"
          aria-label="Wiki revision detail breadcrumb"
        >
          <button
            class="text-orange-600 hover:underline dark:text-orange-400"
            @click="goBackToWiki"
          >
            {{ wikiPage.title }}
          </button>
          <span class="text-gray-400">›</span>
          <button
            class="text-orange-600 hover:underline dark:text-orange-400"
            @click="goBackToRevisions"
          >
            Revision History
          </button>
          <span class="text-gray-400">›</span>
          <span class="text-gray-700 dark:text-gray-300">Revision Detail</span>
        </nav>

        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold dark:text-white">Revision Detail</h1>
            <div v-if="currentRevision.isCurrent" class="mt-2">
              <span
                class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200"
              >
                Most recent edit
              </span>
            </div>
          </div>

          <!-- Redact button -->
          <div
            v-if="
              currentRevision.oldVersionData?.id &&
              currentRevision.oldVersionData.id !== 'current'
            "
          >
            <button
              class="rounded-md border border-red-300 bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:border-red-600 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700"
              :disabled="isDeleting || deleteLoading"
              @click="handleDelete"
            >
              <i
                v-if="isDeleting || deleteLoading"
                class="fas fa-spinner fa-spin mr-2"
              />
              Redact Revision
            </button>
          </div>
        </div>
      </div>

      <!-- Error banner for delete errors -->
      <ErrorBanner v-if="deleteError" :text="deleteError.message" />

      <RevisionDiffContent
        :old-version="currentRevision.oldVersionData"
        :new-version="currentRevision.newVersionData"
        :is-most-recent="currentRevision.isCurrent"
      />
    </div>
  </div>
</template>
