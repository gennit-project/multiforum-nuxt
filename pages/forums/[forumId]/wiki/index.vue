<script setup lang="ts">
  import { computed } from "vue";
  import { useRoute, useRouter } from "nuxt/app";
  import { GET_CHANNEL } from "@/graphQLData/channel/queries";
  import { useQuery } from "@vue/apollo-composable";
  import PencilIcon from "@/components/icons/PencilIcon.vue";
  import PrimaryButton from "@/components/PrimaryButton.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import WikiEditsDropdown from "@/components/wiki/WikiEditsDropdown.vue";
  import { timeAgo } from "@/utils";

  const route = useRoute();
  const router = useRouter();
  const forumId = route.params.forumId as string;

  // Query channel to get wiki data
  const {
    result: channelResult,
    loading,
    error,
  } = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: "all" });

  // Computed property for the channel data
  const channel = computed(() => channelResult.value?.channels[0]);

  // Check if wiki is enabled
  const wikiEnabled = computed(() => channel.value?.wikiEnabled);

  // Check if we have a wiki home page already
  const hasWikiHomePage = computed(() => !!channel.value?.WikiHomePage);

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
      <PrimaryButton @click="createWikiPage">
        <PencilIcon class="mr-2 h-5 w-5" />
        Create Wiki Page
      </PrimaryButton>
    </div>

    <div
      v-else
      class="mx-auto max-w-3xl p-4"
    >
      <!-- Wiki Home Page Content -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold dark:text-white">
            {{ channel.WikiHomePage.title }}
          </h1>
          <PrimaryButton
            :label="'Edit Wiki'"
            @click="router.push(`/forums/${forumId}/wiki/edit/${channel.WikiHomePage.slug}`)"
          >
            <PencilIcon class="mr-2 h-5 w-5" />
          </PrimaryButton>
        </div>
        <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Last updated by {{ channel.WikiHomePage.VersionAuthor?.username || "Unknown" }}
            {{ timeAgo(new Date(channel.WikiHomePage.updatedAt || channel.WikiHomePage.createdAt)) }}
          </span>
          <span class="mx-2">·</span>
          <WikiEditsDropdown :wiki-page="channel.WikiHomePage" />
        </div>
      </div>

      <div class="prose prose-orange max-w-none dark:prose-invert">
        <MarkdownPreview
          :disable-gallery="false"
          :text="channel.WikiHomePage.body"
          :word-limit="3000"
        />
      </div>
    </div>
  </div>
</template>
