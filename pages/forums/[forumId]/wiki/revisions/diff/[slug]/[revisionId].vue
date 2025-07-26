<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter, useHead } from "nuxt/app";
import { GET_WIKI_PAGE } from "@/graphQLData/channel/queries";
import { useQuery, useMutation } from "@vue/apollo-composable";
import { DELETE_TEXT_VERSION } from "@/graphQLData/discussion/mutations";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import type { WikiPage, TextVersion } from "@/__generated__/graphql";
import { useUIStore } from "@/stores/uiStore";
import { storeToRefs } from "pinia";

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
  { errorPolicy: "all" }
);

// Computed property for the wiki page data
const wikiPage = computed(() => wikiPageResult.value?.wikiPages[0] as WikiPage);

// Process all versions to find the specific revision
const allEdits = computed(() => {
  const edits: WikiRevisionData[] = [];

  if (wikiPage.value?.PastVersions?.length) {
    // Create current version entry (as TextVersion structure)
    const currentVersion = {
      id: "current",
      body: wikiPage.value.body,
      createdAt: wikiPage.value.updatedAt || wikiPage.value.createdAt,
      Author: wikiPage.value.VersionAuthor,
      AuthorConnection: {
        edges: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
        totalCount: 0,
      },
    };

    // First item: most recent edit (current vs most recent past version)
    edits.push({
      id: "most-recent-edit",
      author: wikiPage.value.VersionAuthor?.username || "[Deleted]",
      createdAt: wikiPage.value.updatedAt || wikiPage.value.createdAt,
      isCurrent: true,
      // Store the versions for the modal
      oldVersionData: wikiPage.value.PastVersions[0], // Most recent past version
      newVersionData: currentVersion, // Current version
    });

    // Subsequent items: compare each past version with the next one
    wikiPage.value.PastVersions.forEach((version, index) => {
      // Skip the most recent past version since it's already handled above
      if (index === 0) return;
      
      const nextVersion = wikiPage.value.PastVersions[index - 1]; // Next version (more recent)
      
      edits.push({
        id: version.id,
        author: version.Author?.username || "[Deleted]",
        createdAt: version.createdAt,
        isCurrent: false,
        // Store the versions for the modal
        oldVersionData: version,
        newVersionData: nextVersion,
      });
    });
  }

  return edits;
});

// Find the specific revision
const currentRevision = computed(() => {
  return allEdits.value.find(edit => edit.id === revisionId);
});

// Deletion state
const isDeleting = ref(false);

// Computed properties for the revision
const oldVersionUsername = computed(() => {
  return currentRevision.value?.oldVersionData?.Author?.username || "[Deleted]";
});

const newVersionUsername = computed(() => {
  return currentRevision.value?.newVersionData?.Author?.username || "[Deleted]";
});

const oldVersionDate = computed(() => {
  if (!currentRevision.value?.oldVersionData?.createdAt) return "";
  return new Date(currentRevision.value.oldVersionData.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
});

const newVersionDate = computed(() => {
  if (!currentRevision.value?.newVersionData?.createdAt) return "";
  return new Date(currentRevision.value.newVersionData.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
});

const oldContent = computed(() => currentRevision.value?.oldVersionData?.body || "");
const newContent = computed(() => currentRevision.value?.newVersionData?.body || "");

// Diff configuration
const diffMode = ref('split'); // split or unified
const diffLanguage = ref('markdown'); // Set to markdown for wiki content
const diffTheme = computed(() => theme.value === 'dark' ? 'dark' : 'light');
const foldingEnabled = ref(true); // Enable folding of unchanged sections

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
      cache.evict({ id: `TextVersion:${currentRevision.value?.oldVersionData?.id}` });
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
  
  if (confirm("Are you sure you want to delete this revision? This action cannot be undone.")) {
    isDeleting.value = true;
    try {
      await deleteTextVersion({
        id: currentRevision.value.oldVersionData.id,
      });
    } catch (err) {
      console.error("Error deleting revision:", err);
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
    { name: 'description', content: `View revision details for the ${wikiPage.value?.title || 'wiki page'}.` },
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

    <div v-else-if="!wikiPage || !currentRevision" class="mx-auto max-w-2xl p-4 text-center dark:text-white">
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
        <nav class="mb-4 flex items-center space-x-2 text-sm">
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
            <h1 class="text-2xl font-bold dark:text-white">
              Revision Detail
            </h1>
            <div class="mt-2 space-y-1">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                From version by {{ oldVersionUsername }} ({{ oldVersionDate }})
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                To version by {{ newVersionUsername }} ({{ newVersionDate }})
              </div>
            </div>
            <div
              v-if="currentRevision.isCurrent"
              class="mt-2"
            >
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200"
              >
                Current version
              </span>
            </div>
          </div>
          
          <!-- Delete button -->
          <div v-if="currentRevision.oldVersionData?.id && currentRevision.oldVersionData.id !== 'current'">
            <button
              class="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:border-red-600 dark:hover:bg-red-700 disabled:opacity-50"
              :disabled="isDeleting || deleteLoading"
              @click="handleDelete"
            >
              <i v-if="isDeleting || deleteLoading" class="fas fa-spinner fa-spin mr-2"></i>
              Delete Revision
            </button>
          </div>
        </div>
      </div>

      <!-- Error banner for delete errors -->
      <ErrorBanner v-if="deleteError" :text="deleteError.message" />

      <!-- Professional Diff View using vue-diff -->
      <div class="rounded-md border dark:border-gray-700 overflow-hidden">
        <!-- Diff mode toggle -->
        <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">View mode:</span>
              <div class="flex rounded-md shadow-sm">
                <button
                  class="px-3 py-1 text-xs font-medium rounded-l-md border"
                  :class="{
                    'bg-orange-600 text-white border-orange-600': diffMode === 'split',
                    'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600': diffMode !== 'split'
                  }"
                  @click="diffMode = 'split'"
                >
                  Split
                </button>
                <button
                  class="px-3 py-1 text-xs font-medium rounded-r-md border-t border-r border-b"
                  :class="{
                    'bg-orange-600 text-white border-orange-600': diffMode === 'unified',
                    'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600': diffMode !== 'unified',
                    'border-l-0': diffMode !== 'unified'
                  }"
                  @click="diffMode = 'unified'"
                >
                  Unified
                </button>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <label class="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                <input 
                  v-model="foldingEnabled" 
                  type="checkbox" 
                  class="rounded text-orange-600 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600"
                >
                <span>Fold unchanged sections</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Vue Diff Component -->
        <div class="min-h-[400px]">
          <ClientOnly>
            <VueDiff
              :mode="diffMode"
              :theme="diffTheme"
              :language="diffLanguage"
              :prev="oldContent"
              :current="newContent"
              :folding="foldingEnabled"
              :virtual-scroll="{ height: 600, lineMinHeight: 20, delay: 100 }"
            />
            <template #fallback>
              <div class="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                <div class="text-center">
                  <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
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