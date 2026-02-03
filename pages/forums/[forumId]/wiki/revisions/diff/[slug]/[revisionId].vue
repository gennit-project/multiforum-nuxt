<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { GET_WIKI_PAGE } from '@/graphQLData/channel/queries';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { DELETE_TEXT_VERSION } from '@/graphQLData/discussion/mutations';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import type { WikiPage, TextVersion } from '@/__generated__/graphql';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

// Import CodeDiff dynamically to avoid SSR issues
const CodeDiff = defineAsyncComponent(async () => {
  const vCodeDiffModule = await import('v-code-diff');
  const highlightModule = await import('highlight.js/lib/languages/markdown');

  // Register markdown language with highlight.js
  if ((vCodeDiffModule as any).hljs) {
    (vCodeDiffModule as any).hljs.registerLanguage(
      'markdown',
      highlightModule.default
    );
  }

  return vCodeDiffModule.CodeDiff;
});

// Define type for revision data
interface WikiRevisionData {
  id: string;
  author: string;
  createdAt: string;
  isCurrent: boolean;
  oldVersionData?: TextVersion;
  newVersionData?: TextVersion;
}

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const slug = route.params.slug as string;
const revisionId = route.params.revisionId as string;

// UI Store for theme
const uiStore = useUIStore();
const { theme } = storeToRefs(uiStore);

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
  const edits: WikiRevisionData[] = [];

  if (wikiPage.value?.PastVersions?.length) {
    // Create current version entry (as TextVersion structure)
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

    // Add an entry for the most recent edit only if content actually changed
    if (wikiPage.value.PastVersions.length > 0) {
      const mostRecentPastVersion = wikiPage.value.PastVersions[0];
      if (!mostRecentPastVersion) return edits;
      const currentContent = wikiPage.value.body ?? undefined;
      const pastContent = mostRecentPastVersion.body ?? undefined;

      // Only add the most recent edit if content actually changed
      if (currentContent !== pastContent) {
        edits.push({
          id: 'most-recent-edit',
          author: wikiPage.value.VersionAuthor?.username || '[Deleted]',
          createdAt: wikiPage.value.updatedAt || wikiPage.value.createdAt,
          isCurrent: true,
          // Show what changed in the most recent edit
          oldVersionData: mostRecentPastVersion,
          newVersionData: currentVersion,
        });
      }
    }

    // Process each past version - show what changed in that specific edit
    wikiPage.value.PastVersions.forEach((version, index) => {
      // Skip the most recent past version since we handled it above
      if (index === 0) return;

      const previousVersion: TextVersion = wikiPage.value.PastVersions[
        index + 1
      ] || {
        id: 'initial',
        body: '', // Show diff from empty if this was the first edit
        createdAt: version.createdAt,
        Author: null,
        AuthorConnection: {
          edges: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
          totalCount: 0,
        },
      };

      edits.push({
        id: version.id,
        author: version.Author?.username || '[Deleted]',
        createdAt: version.createdAt,
        isCurrent: false,
        // Show what changed in this specific edit
        oldVersionData: previousVersion, // Version before this edit
        newVersionData: version, // This version (result of the edit)
      });
    });
  }

  return edits;
});

// Find the specific revision
const currentRevision = computed(() => {
  return allEdits.value.find((edit) => edit.id === revisionId);
});

// Deletion state
const isDeleting = ref(false);

// Computed properties for the revision
const oldVersionUsername = computed(() => {
  return currentRevision.value?.oldVersionData?.Author?.username || '[Deleted]';
});

const newVersionUsername = computed(() => {
  return currentRevision.value?.newVersionData?.Author?.username || '[Deleted]';
});

const oldVersionDate = computed(() => {
  if (!currentRevision.value?.oldVersionData?.createdAt) return '';
  return new Date(
    currentRevision.value.oldVersionData.createdAt
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
});

const newVersionDate = computed(() => {
  if (!currentRevision.value?.newVersionData?.createdAt) return '';
  return new Date(
    currentRevision.value.newVersionData.createdAt
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
});

const oldContent = computed(
  () => currentRevision.value?.oldVersionData?.body || ''
);
const newContent = computed(
  () => currentRevision.value?.newVersionData?.body || ''
);

// Diff configuration for v-code-diff
const outputFormat = ref('side-by-side'); // side-by-side or line-by-line
const diffLanguage = ref('markdown'); // Now supports markdown with extended language
const diffTheme = computed(() => (theme.value === 'dark' ? 'dark' : 'light'));

// Set up delete mutation
const {
  mutate: deleteTextVersion,
  loading: deleteLoading,
  error: deleteError,
  onDone,
} = useMutation(DELETE_TEXT_VERSION, {
  update: (cache, { data }) => {
    if (data?.deleteTextVersions?.nodesDeleted) {
      // Clear cache for this revision
      cache.evict({
        id: `TextVersion:${currentRevision.value?.oldVersionData?.id}`,
      });
      cache.gc();
    }
  },
});

onDone(() => {
  isDeleting.value = false;
  // Navigate back to revision history
  router.push(`/forums/${forumId}/wiki/revisions/${slug}`);
});

const handleDelete = async () => {
  if (!currentRevision.value?.oldVersionData?.id) return;

  if (
    confirm(
      'Are you sure you want to delete this revision? This action cannot be undone.'
    )
  ) {
    isDeleting.value = true;
    try {
      await deleteTextVersion({
        id: currentRevision.value.oldVersionData.id,
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
            <div class="mt-2 space-y-1">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                From version by {{ oldVersionUsername }} ({{ oldVersionDate }})
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                To version by {{ newVersionUsername }} ({{ newVersionDate }})
              </div>
            </div>
            <div v-if="currentRevision.isCurrent" class="mt-2">
              <span
                class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200"
              >
                Most recent edit
              </span>
            </div>
          </div>

          <!-- Delete button -->
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
              Delete Revision
            </button>
          </div>
        </div>
      </div>

      <!-- Error banner for delete errors -->
      <ErrorBanner v-if="deleteError" :text="deleteError.message" />

      <!-- Professional Diff View using v-code-diff -->
      <div class="overflow-hidden rounded-md border dark:border-gray-700">
        <!-- Diff mode toggle -->
        <div
          class="bg-gray-50 border-b px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >View mode:</span
              >
              <div class="flex rounded-md shadow-sm">
                <button
                  class="rounded-l-md border px-3 py-1 text-xs font-medium"
                  :class="{
                    'border-orange-600 bg-orange-600 text-white':
                      outputFormat === 'side-by-side',
                    'hover:bg-gray-50 border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600':
                      outputFormat !== 'side-by-side',
                  }"
                  @click="outputFormat = 'side-by-side'"
                >
                  Side by Side
                </button>
                <button
                  class="rounded-r-md border-b border-r border-t px-3 py-1 text-xs font-medium"
                  :class="{
                    'border-orange-600 bg-orange-600 text-white':
                      outputFormat === 'line-by-line',
                    'hover:bg-gray-50 border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600':
                      outputFormat !== 'line-by-line',
                    'border-l-0': outputFormat !== 'line-by-line',
                  }"
                  @click="outputFormat = 'line-by-line'"
                >
                  Line by Line
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- V-Code-Diff Component -->
        <div class="min-h-[400px]">
          <ClientOnly>
            <CodeDiff
              :key="`${revisionId}-${outputFormat}-${diffTheme}`"
              :old-string="oldContent"
              :new-string="newContent"
              :output-format="outputFormat"
              :language="diffLanguage"
              :theme="diffTheme"
              :context="10"
              class="diff-container"
            />
            <template #fallback>
              <div
                class="flex h-96 items-center justify-center text-gray-500 dark:text-gray-400"
              >
                <div class="text-center">
                  <i class="fas fa-spinner fa-spin mb-2 text-2xl" />
                  <p>Loading diff viewer...</p>
                </div>
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the diff container takes full width */
:deep(.diff-container) {
  width: 100%;
  border-radius: 0;
}

/* Override v-code-diff styles for better integration */
:deep(.v-code-diff) {
  border: none;
  border-radius: 0;
}

/* Ensure proper spacing */
:deep(.v-code-diff .d2h-wrapper) {
  border: none;
}

/* Remove gray borders between diff rows */
:deep(.diff-container table) {
  border-collapse: collapse !important;
}

:deep(.diff-container td) {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  padding: 0 !important; /* Reset padding */
}

:deep(.diff-container tr) {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
}

:deep(.diff-container tbody tr) {
  border: none !important;
}

:deep(.diff-container .d2h-code-line) {
  border: none !important;
  padding: 2px 8px !important; /* Consistent padding for code lines */
  line-height: 1.4 !important; /* Consistent line height */
}

:deep(.diff-container .d2h-code-linenumber) {
  border-right: 1px solid #e1e4e8 !important; /* Keep only the line number separator */
  padding: 2px 8px !important; /* Consistent padding for line numbers */
  line-height: 1.4 !important; /* Consistent line height */
}

/* Force consistent row height and spacing */
:deep(.diff-container .d2h-code-side-line) {
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.diff-container .d2h-code-side-linenumber) {
  padding: 2px 8px !important;
  margin: 0 !important;
}

/* Ensure consistent table cell spacing */
:deep(.diff-container table td) {
  vertical-align: top !important;
  padding: 0 !important;
}

/* Reset any inherited padding from parent components */
:deep(.diff-container *) {
  box-sizing: border-box !important;
}

/* Ensure consistent styling regardless of navigation method */
:deep(.diff-container .d2h-file-wrapper) {
  border: none !important;
}

:deep(.diff-container .d2h-file-header) {
  border: none !important;
  border-bottom: 1px solid #e1e4e8 !important; /* Keep only header separator */
}
</style>
