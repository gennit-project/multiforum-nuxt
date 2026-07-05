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
import WikiPagePinButton from '@/components/wiki/WikiPagePinButton.vue';
import WikiPageLockButton from '@/components/wiki/WikiPageLockButton.vue';
import FontSizeControl from '@/components/channel/FontSizeControl.vue';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { timeAgo } from '@/utils';
import { buildWikiPageHead } from '@/utils/wikiSeo';
import { useUsername } from '@/composables/useAuthState';
import { canEditWikiPage } from '@/utils/wikiPageLockPermissions';
import type { WikiPage } from '@/__generated__/graphql';

type LockableWikiPage = WikiPage & {
  locked?: boolean | null;
  lockReason?: string | null;
};

const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const slug = route.params.slug as string;
const uiStore = useUIStore();
const { fontSize } = storeToRefs(uiStore);
const username = useUsername();

// Query wiki page data for the specific slug
const {
  result: wikiPageResult,
  loading,
  error,
  refetch: refetchWikiPage,
} = useQuery(
  GET_WIKI_PAGE,
  {
    channelUniqueName: forumId,
    slug: slug,
  },
  { errorPolicy: 'all' }
);

// Computed property for the wiki page data
const wikiPage = computed(
  () => wikiPageResult.value?.wikiPages?.[0] as LockableWikiPage | undefined
);
const wikiPageBody = computed(() => wikiPage.value?.body || '');
const wikiPageSlug = computed(() => wikiPage.value?.slug || slug);

// Query channel to check if wiki is enabled
const {
  result: channelResult,
  loading: channelLoading,
  error: channelError,
  refetch: refetchChannel,
} = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: 'all' });

// Computed property for the channel data
const channel = computed(() => channelResult.value?.channels?.[0]);
const canEditCurrentWikiPage = computed(() =>
  canEditWikiPage({
    channel: channel.value,
    wikiPage: wikiPage.value,
    username: username.value,
  })
);
const refetchWikiLockState = () => {
  refetchChannel();
  refetchWikiPage();
};

// Check if wiki is enabled
const wikiEnabled = computed(() => channel.value?.wikiEnabled);

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

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 class="text-2xl font-bold dark:text-white">
            {{ wikiPage.title }}
          </h1>
          <div class="flex flex-wrap items-center gap-2">
            <WikiPagePinButton
              v-if="channel"
              :channel="channel"
              :wiki-page="wikiPage"
              :channel-unique-name="forumId"
              @pinned-changed="refetchChannel"
            />
            <WikiPageLockButton
              v-if="channel"
              :channel="channel"
              :wiki-page="wikiPage"
              @lock-changed="refetchWikiLockState"
            />
            <PrimaryButton
              v-if="canEditCurrentWikiPage"
              :label="'Edit Page'"
              @click="
                router.push(`/forums/${forumId}/wiki/edit/${wikiPageSlug}`)
              "
            >
              <PencilIcon class="mr-2 h-5 w-5" />
            </PrimaryButton>
          </div>
        </div>
        <div
          v-if="wikiPage.locked"
          class="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
        >
          <p class="font-semibold">This wiki page is locked.</p>
          <p v-if="wikiPage.lockReason" class="mt-1">
            {{ wikiPage.lockReason }}
          </p>
          <p v-if="!canEditCurrentWikiPage" class="mt-1">
            Only forum owners with wiki update permission can edit it.
          </p>
        </div>
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
              :to="`/forums/${forumId}/wiki/revisions/${wikiPageSlug}`"
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              See edits
            </router-link>
          </template>
        </div>
      </div>

      <!-- Mobile On This Page Dropdown -->
      <div class="mb-4 block xl:hidden">
        <OnThisPage :markdown-content="wikiPageBody" :is-mobile="true" />
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
              <MarkdownRenderer :text="wikiPageBody" :font-size="fontSize" />
            </div>
          </div>

          <!-- Bottom edit button - Docusaurus style -->
          <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              v-if="canEditCurrentWikiPage"
              class="flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              @click="
                router.push(`/forums/${forumId}/wiki/edit/${wikiPageSlug}`)
              "
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
          <OnThisPage :markdown-content="wikiPageBody" :is-mobile="false" />
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
