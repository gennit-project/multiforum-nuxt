<script setup lang="ts">
import { config } from '@/config';
import { computed } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { GET_CHANNEL, GET_WIKI_PAGE } from '@/graphQLData/channel/queries';
import { useQuery } from '@vue/apollo-composable';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import MarkdownRenderer from '@/components/MarkdownRenderer.vue';
import OnThisPage from '@/components/wiki/OnThisPage.vue';
import FontSizeControl from '@/components/channel/FontSizeControl.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { useUsername } from '@/composables/useAuthState';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { timeAgo } from '@/utils';
import { buildWikiPageHead } from '@/utils/wikiSeo';

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const slug = route.params.slug as string;
const uiStore = useUIStore();
const { fontSize } = storeToRefs(uiStore);

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
const wikiPage = computed(() => wikiPageResult.value?.wikiPages?.[0]);

// Query channel to check if wiki is enabled
const {
  result: channelResult,
  loading: channelLoading,
  error: channelError,
} = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: 'all' });

// Computed property for the channel data
const channel = computed(() => channelResult.value?.channels?.[0]);

// Check if wiki is enabled
const wikiEnabled = computed(() => channel.value?.wikiEnabled);

// Suspended users cannot edit wiki pages; gate the edit entry points and show a
// notice, mirroring the wiki home (index) page.
const usernameVar = useUsername();
const {
  activeSuspension,
  issueNumber: suspensionIssueNumber,
  suspendedUntil,
  suspendedIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(forumId);

const wikiEditBlockedBySuspension = computed(
  () => !!usernameVar.value && !!activeSuspension.value
);
const showWikiEditSuspensionNotice = computed(
  () => wikiEditBlockedBySuspension.value && !!suspensionIssueNumber.value
);
const wikiEditSuspensionMessage =
  'You are suspended in this forum and cannot edit wiki pages.';

function editWikiPage() {
  if (wikiEditBlockedBySuspension.value) return;
  router.push(`/forums/${forumId}/wiki/edit/${wikiPage.value?.slug}`);
}

// Navigate to wiki home
function goToWikiHome() {
  router.push(`/forums/${forumId}/wiki`);
}

// SEO metadata setup
const { onResult: onGetWikiPageResult } = useQuery(
  GET_WIKI_PAGE,
  {
    channelUniqueName: forumId,
    slug: slug,
  },
  { errorPolicy: 'all' }
);

onGetWikiPageResult((result) => {
  try {
    // The pure head-building logic lives in utils/wikiSeo.ts (unit-tested).
    const head = buildWikiPageHead({
      wikiPages: result?.data?.wikiPages,
      forumId,
      slug,
      serverDisplayName: config.serverDisplayName,
      baseUrl: import.meta.env.VITE_BASE_URL,
    });
    if (head) useHead(head);
  } catch (error) {
    console.error('Error setting wiki page SEO metadata:', error);
  }
});
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
      <p class="mt-2 text-sm">{{ (error || channelError)?.message }}</p>
    </div>

    <div
      v-else-if="!wikiEnabled"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p>The wiki feature is not enabled for this forum.</p>
      <PrimaryButton :label="'Go Back'" @click="router.back()" />
    </div>

    <div
      v-else-if="!wikiPage"
      class="mx-auto max-w-2xl p-4 text-center dark:text-white"
    >
      <p class="mb-4 text-lg">This wiki page doesn't exist.</p>
      <div class="space-x-4">
        <PrimaryButton :label="'Go to Wiki Home'" @click="goToWikiHome" />
        <PrimaryButton
          :label="'Create This Page'"
          @click="router.push(`/forums/${forumId}/wiki/create?slug=${slug}`)"
        />
      </div>
    </div>

    <div v-else class="mx-auto max-w-full p-4">
      <!-- Wiki Page Content -->
      <div class="mb-4">
        <!-- Breadcrumb navigation -->
        <nav class="mb-4" aria-label="Wiki breadcrumb">
          <span
            class="cursor-pointer text-orange-600 hover:underline dark:text-orange-400"
            @click="goToWikiHome"
          >
            Wiki Home
          </span>
          <span class="mx-2 text-gray-500">›</span>
          <span class="text-gray-700 dark:text-gray-300">{{
            wikiPage.title
          }}</span>
        </nav>

        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold dark:text-white">
            {{ wikiPage.title }}
          </h1>
          <PrimaryButton
            :label="'Edit Page'"
            :disabled="wikiEditBlockedBySuspension"
            @click="editWikiPage"
          >
            <PencilIcon class="mr-2 h-5 w-5" />
          </PrimaryButton>
        </div>
        <SuspensionNotice
          v-if="showWikiEditSuspensionNotice"
          class="mt-4"
          :message="wikiEditSuspensionMessage"
          :issue-number="suspensionIssueNumber ?? 0"
          :channel-id="suspensionChannelId"
          :suspended-until="suspendedUntil ?? undefined"
          :suspended-indefinitely="suspendedIndefinitely"
        />
        <div
          class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400"
        >
          <span>
            Last updated by {{ wikiPage.VersionAuthor?.username || 'Unknown' }}
            {{ timeAgo(new Date(wikiPage.updatedAt || wikiPage.createdAt)) }}
          </span>

          <!-- Show see edits link if there are past versions -->
          <template
            v-if="wikiPage.PastVersions && wikiPage.PastVersions.length > 0"
          >
            <span class="mx-2">·</span>
            <router-link
              :to="`/forums/${forumId}/wiki/revisions/${wikiPage.slug}`"
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              See edits
            </router-link>
          </template>
        </div>
      </div>

      <!-- Mobile On This Page Dropdown -->
      <div class="mb-4 block xl:hidden">
        <OnThisPage :markdown-content="wikiPage.body" :is-mobile="true" />
      </div>

      <!-- Mobile font size control -->
      <div class="mb-4 block xl:hidden">
        <FontSizeControl />
      </div>

      <div class="flex flex-col gap-6 xl:flex-row">
        <!-- Main content - first on mobile/tablet, middle on desktop -->
        <div class="min-w-0 flex-1 xl:order-2">
          <div class="flex w-full justify-center">
            <div>
              <MarkdownRenderer :text="wikiPage.body" :font-size="fontSize" />
            </div>
          </div>

          <!-- Bottom edit button - Docusaurus style -->
          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              class="flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              :disabled="wikiEditBlockedBySuspension"
              :class="{
                'cursor-default opacity-60 hover:text-gray-600 dark:hover:text-gray-400':
                  wikiEditBlockedBySuspension,
              }"
              @click="editWikiPage"
            >
              <PencilIcon class="mr-2 h-4 w-4" />
              Edit this page
            </button>
          </div>
        </div>

        <!-- Left sidebar - On This Page (desktop only) -->
        <div
          class="sticky top-0 hidden max-h-screen w-64 flex-shrink-0 overflow-y-auto xl:order-1 xl:flex"
        >
          <!-- On This Page Navigation -->
          <OnThisPage :markdown-content="wikiPage.body" :is-mobile="false" />
        </div>

        <!-- Right sidebar - controls (desktop only) -->
        <div
          class="sticky top-0 hidden max-h-screen w-64 flex-shrink-0 overflow-y-auto xl:order-3 xl:flex"
        >
          <div class="w-full py-2">
            <FontSizeControl class="mb-6" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
