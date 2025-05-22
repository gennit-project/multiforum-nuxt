<script setup lang="ts">
  import { computed } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { useQuery } from "@vue/apollo-composable";
  import PencilIcon from "@/components/icons/PencilIcon.vue";
  import DocumentIcon from "@/components/icons/DocumentIcon.vue";
  import GenericButton from "@/components/GenericButton.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import WikiEditsDropdown from "@/components/wiki/WikiEditsDropdown.vue";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import { timeAgo } from "@/utils";

  const route = useRoute();
  const router = useRouter();
  const forumId = route.params.forumId as string;

  // Query channel data (includes WikiHomePage and wikiEnabled)
  const {
    result: channelResult,
    loading,
    error,
  } = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: "all" });

  // Computed property for the channel data
  const channel = computed(() => channelResult.value?.channels[0]);

  // Check if wiki is enabled
  const wikiEnabled = computed(() => channel.value?.wikiEnabled);

  // Get wiki home page from channel relationship
  const wikiHomePage = computed(() => channel.value?.WikiHomePage);

  // Check if we have a wiki home page already
  const hasWikiHomePage = computed(() => !!wikiHomePage.value);

  // Navigate to create wiki page
  function createWikiPage() {
    router.push(`/forums/${forumId}/wiki/create`);
  }
</script>

<template>
  <div>
    <div
      v-if="loading"
      class="flex items-center justify-center p-8"
    >
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="error"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki data.</p>
      <p class="mt-2 text-sm">{{ error.message }}</p>
    </div>

    <div
      v-else-if="!wikiEnabled"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>The wiki feature is not enabled for this forum.</p>
    </div>

    <div
      v-else-if="!hasWikiHomePage"
      class="mx-auto max-w-2xl p-8 text-center dark:text-white"
    >
      <div class="mb-6 text-gray-600 dark:text-gray-300">
        <p class="text-lg">
          You don't have any wiki pages yet.
          <span
            class="cursor-pointer text-orange-600 hover:underline dark:text-orange-400"
            @click="createWikiPage"
            >Add one?</span
          >
        </p>
      </div>
      <GenericButton
        :label="'Create Wiki Page'"
        @click="createWikiPage"
      >
        <DocumentIcon class="mr-2 h-5 w-5" />
      </GenericButton>
    </div>

    <div
      v-else
      class="mx-auto max-w-7xl p-4"
    >
      <!-- Wiki Home Page Content -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold dark:text-white">
            {{ wikiHomePage.title }}
          </h1>
          <div class="flex space-x-3">
            <GenericButton
              :text="'Add Page'"
              @click="router.push(`/forums/${forumId}/wiki/create-child`)"
            >
              <DocumentIcon class="mr-2 h-5 w-5" />
            </GenericButton>
            <GenericButton
              :text="'Edit Wiki'"
              @click="router.push(`/forums/${forumId}/wiki/edit/${wikiHomePage.slug}`)"
            >
              <PencilIcon class="mr-2 h-5 w-5" />
            </GenericButton>
          </div>
        </div>
        <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Last updated by {{ wikiHomePage.VersionAuthor?.username || "Unknown" }}
            {{ timeAgo(new Date(wikiHomePage.updatedAt || wikiHomePage.createdAt)) }}
          </span>
          <template v-if="wikiHomePage?.PastVersions?.length">
            <span class="mx-2">·</span>
            <WikiEditsDropdown :wiki-page="wikiHomePage" />
          </template>
        </div>
      </div>

      <div class="flex gap-8">
        <!-- Main content -->
        <div class="flex-1">
          <div class="prose prose-orange max-w-none dark:prose-invert">
            <MarkdownPreview
              :disable-gallery="false"
              :text="wikiHomePage.body"
              :word-limit="3000"
            />
          </div>
        </div>

        <!-- Sidebar with child pages -->
        <div
          v-if="wikiHomePage.ChildPages && wikiHomePage.ChildPages.length > 0"
          class="w-80 flex-shrink-0"
        >
          <div
            class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-500 dark:bg-gray-800"
          >
            <h3 class="font-semibold mb-4 text-lg text-gray-900 dark:text-white">Wiki Pages</h3>
            <div class="space-y-2">
              <div
                v-for="childPage in wikiHomePage.ChildPages"
                :key="childPage.id"
                class="group"
              >
                <a
                  :href="`/forums/${forumId}/wiki/${childPage.slug}`"
                  class="hover:bg-orange-50 block rounded px-2 py-1 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                  @click.prevent="router.push(`/forums/${forumId}/wiki/${childPage.slug}`)"
                >
                  {{ childPage.title }}
                </a>
                <p class="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  Updated {{ timeAgo(new Date(childPage.updatedAt || childPage.createdAt)) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
