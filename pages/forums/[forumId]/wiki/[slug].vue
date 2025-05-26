<script setup lang="ts">
  import { computed } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { GET_CHANNEL, GET_WIKI_PAGE } from "@/graphQLData/channel/queries";
  import { useQuery } from "@vue/apollo-composable";
  import PencilIcon from "@/components/icons/PencilIcon.vue";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import WikiEditsDropdown from "@/components/wiki/WikiEditsDropdown.vue";
  import MarkdownPreview from "@/components/MarkdownPreview.vue";
  import { timeAgo } from "@/utils";

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
    { errorPolicy: "all" }
  );

  // Computed property for the wiki page data
  const wikiPage = computed(() => wikiPageResult.value?.wikiPages[0]);

  // Query channel to check if wiki is enabled
  const {
    result: channelResult,
    loading: channelLoading,
    error: channelError,
  } = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: "all" });

  // Computed property for the channel data
  const channel = computed(() => channelResult.value?.channels[0]);

  // Check if wiki is enabled
  const wikiEnabled = computed(() => channel.value?.wikiEnabled);

  // Navigate to wiki home
  function goToWikiHome() {
    router.push(`/forums/${forumId}/wiki`);
  }
</script>

<template>
  <div>
    <div
      v-if="loading || channelLoading"
      class="flex items-center justify-center p-8"
    >
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="error || channelError"
      class="mx-auto max-w-2xl rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki page.</p>
      <p class="mt-2 text-sm">{{ (error || channelError).message }}</p>
    </div>

    <div
      v-else-if="!wikiEnabled"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>The wiki feature is not enabled for this forum.</p>
      <PrimaryButton
        :label="'Go Back'"
        @click="router.back()"
      />
    </div>

    <div
      v-else-if="!wikiPage"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p class="mb-4 text-lg">This wiki page doesn't exist.</p>
      <div class="space-x-4">
        <PrimaryButton
          :label="'Go to Wiki Home'"
          @click="goToWikiHome"
        />
        <PrimaryButton
          :label="'Create This Page'"
          @click="router.push(`/forums/${forumId}/wiki/create?slug=${slug}`)"
        />
      </div>
    </div>

    <div
      v-else
      class="mx-auto max-w-3xl p-4"
    >
      <!-- Wiki Page Content -->
      <div class="mb-4">
        <!-- Breadcrumb navigation -->
        <nav class="mb-4">
          <span
            class="cursor-pointer text-orange-600 hover:underline dark:text-orange-400"
            @click="goToWikiHome"
          >
            Wiki Home
          </span>
          <span class="mx-2 text-gray-500">›</span>
          <span class="text-gray-700 dark:text-gray-300">{{ wikiPage.title }}</span>
        </nav>

        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold dark:text-white">
            {{ wikiPage.title }}
          </h1>
          <PrimaryButton
            :label="'Edit Page'"
            @click="router.push(`/forums/${forumId}/wiki/edit/${wikiPage.slug}`)"
          >
            <PencilIcon class="mr-2 h-5 w-5" />
          </PrimaryButton>
        </div>
        <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Last updated by {{ wikiPage.VersionAuthor?.username || "Unknown" }}
            {{ timeAgo(new Date(wikiPage.updatedAt || wikiPage.createdAt)) }}
          </span>
          <template v-if="wikiPage?.PastVersions?.length">
            <span class="mx-2">·</span>
            <WikiEditsDropdown :wiki-page="wikiPage" />
          </template>
        </div>
      </div>

      <div class="prose prose-orange max-w-none dark:prose-invert">
        <MarkdownPreview
          :disable-gallery="false"
          :text="wikiPage.body"
          :word-limit="3000"
        />
      </div>
    </div>
  </div>
</template>
