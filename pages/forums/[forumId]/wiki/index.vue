<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import type { User, WikiPage } from '@/__generated__/graphql';
import { config } from '@/config';
import { GET_CHANNEL } from '@/graphQLData/channel/queries';
import { GET_SITE_WIDE_WIKI_LIST } from '@/graphQLData/wiki/queries';
import ArrowUpRightIcon from '@/components/icons/ArrowUpRightIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import DocumentIcon from '@/components/icons/DocumentIcon.vue';
import PencilIcon from '@/components/icons/PencilIcon.vue';
import StarIcon from '@/components/icons/StarIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import GenericButton from '@/components/GenericButton.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import RequireAuth from '@/components/auth/RequireAuth.vue';
import SearchBar from '@/components/SearchBar.vue';
import SuspensionNotice from '@/components/SuspensionNotice.vue';
import { useUsername } from '@/composables/useAuthState';
import { useChannelSuspensionNotice } from '@/composables/useSuspensionNotice';
import { buildWikiHomeHead } from '@/utils/wikiSeo';
import { formatWikiExcerpt, formatWordCount } from '@/utils/wikiSearchDisplay';
import { getPlainWikiTitle } from '@/utils/wikiTitle';
import { relativeTime } from '@/utils';

const WIKI_PAGE_LIMIT = 100;

type WikiSearchPage = Pick<
  WikiPage,
  | 'id'
  | 'title'
  | 'body'
  | 'slug'
  | 'channelUniqueName'
  | 'createdAt'
  | 'updatedAt'
> & {
  VersionAuthor?: Pick<User, 'username' | 'displayName' | 'profilePicURL'> | null;
};

const usernameVar = useUsername();
const route = useRoute();
const router = useRouter();
const forumId = route.params.forumId as string;
const searchInput = ref('');

const {
  result: channelResult,
  loading: channelLoading,
  error: channelError,
  onResult: onGetChannelResult,
} = useQuery(GET_CHANNEL, { uniqueName: forumId }, { errorPolicy: 'all' });

const channel = computed(() => channelResult.value?.channels?.[0]);
const wikiEnabled = computed(() => channel.value?.wikiEnabled);
const wikiHomePage = computed(() => channel.value?.WikiHomePage);
const hasWikiHomePage = computed(() => !!wikiHomePage.value);

const {
  result: wikiResult,
  loading: wikiLoading,
  error: wikiError,
} = useQuery(GET_SITE_WIDE_WIKI_LIST, {
  searchInput,
  selectedChannels: [forumId],
  options: { limit: WIKI_PAGE_LIMIT, offset: 0 },
});

const wikiPages = computed<WikiSearchPage[]>(() => {
  return (wikiResult.value?.getSiteWideWikiList?.wikiPages || []) as WikiSearchPage[];
});

const aggregateWikiPageCount = computed(() => {
  return wikiResult.value?.getSiteWideWikiList?.aggregateWikiPageCount || 0;
});

const pinnedWikiPageIds = computed(() => {
  return new Set(
    (channel.value?.PinnedWikiPages || []).map(
      (page: Pick<WikiPage, 'id'>) => page.id
    )
  );
});

const homePageId = computed(() => wikiHomePage.value?.id);

const pinnedWikiPages = computed(() => {
  return wikiPages.value.filter(
    (page) =>
      page.id !== homePageId.value && pinnedWikiPageIds.value.has(page.id)
  );
});

const regularWikiPages = computed(() => {
  return wikiPages.value.filter(
    (page) =>
      page.id !== homePageId.value && !pinnedWikiPageIds.value.has(page.id)
  );
});

const showIntroduction = computed(() => {
  if (!wikiHomePage.value) return false;
  if (!searchInput.value) return true;
  return wikiPages.value.some((page) => page.id === homePageId.value);
});

const hasSearchResults = computed(() => {
  return (
    showIntroduction.value ||
    pinnedWikiPages.value.length > 0 ||
    regularWikiPages.value.length > 0
  );
});

const {
  activeSuspension,
  issueNumber: suspensionIssueNumber,
  suspendedUntil,
  suspendedIndefinitely,
  channelId: suspensionChannelId,
} = useChannelSuspensionNotice(forumId);

const wikiEditBlockedBySuspension = computed(() => {
  return !!usernameVar.value && !!activeSuspension.value;
});

const showWikiEditSuspensionNotice = computed(() => {
  return wikiEditBlockedBySuspension.value && !!suspensionIssueNumber.value;
});

const wikiEditSuspensionMessage =
  'You are suspended in this forum and cannot edit wiki pages.';

function createWikiPage() {
  if (wikiEditBlockedBySuspension.value) return;
  router.push(`/forums/${forumId}/wiki/create`);
}

function createChildWikiPage() {
  if (wikiEditBlockedBySuspension.value) return;
  router.push(`/forums/${forumId}/wiki/create-child`);
}

function editWikiPage(slug: string) {
  if (wikiEditBlockedBySuspension.value) return;
  router.push(`/forums/${forumId}/wiki/edit/${slug}`);
}

function updateSearchInput(value: string) {
  searchInput.value = value;
}

onGetChannelResult((result) => {
  try {
    const head = buildWikiHomeHead({
      channels: result?.data?.channels,
      forumId,
      serverDisplayName: config.serverDisplayName,
      baseUrl: import.meta.env.VITE_BASE_URL,
    });
    if (head) useHead(head);
  } catch (error) {
    console.error('Error setting wiki index SEO metadata:', error);
  }
});
</script>

<template>
  <div
    class="mx-auto w-full max-w-6xl px-4 py-6 text-gray-900 sm:px-6 sm:py-8 lg:px-8 dark:text-gray-100"
  >
    <div
      v-if="channelLoading || wikiLoading"
      class="flex items-center justify-center py-16"
    >
      <LoadingSpinner size="lg" />
    </div>

    <div
      v-else-if="channelError || wikiError"
      class="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
    >
      <p>Sorry, there was an error loading the wiki data.</p>
      <p class="mt-2">{{ channelError?.message || wikiError?.message }}</p>
    </div>

    <div
      v-else-if="!wikiEnabled"
      class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/60"
    >
      <p>The wiki feature is not enabled for this forum.</p>
    </div>

    <div
      v-else-if="!hasWikiHomePage"
      class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/60"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500"
      >
        <BookIcon class="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 class="mt-4 text-lg font-semibold">Start this forum's wiki</h1>
      <p
        class="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400"
      >
        Create an introduction, then add guides and reference pages for the
        community.
      </p>
      <div class="mt-6 flex justify-center">
        <RequireAuth>
          <template #has-auth>
            <GenericButton
              text="Create Wiki Page"
              :disabled="wikiEditBlockedBySuspension"
              @click="createWikiPage"
            >
              <DocumentIcon class="mr-2 h-5 w-5" />
            </GenericButton>
          </template>
          <template #does-not-have-auth>
            <GenericButton text="Create Wiki Page">
              <DocumentIcon class="mr-2 h-5 w-5" />
            </GenericButton>
          </template>
        </RequireAuth>
      </div>
      <SuspensionNotice
        v-if="showWikiEditSuspensionNotice"
        class="mx-auto mt-4 max-w-2xl text-left"
        :message="wikiEditSuspensionMessage"
        :issue-number="suspensionIssueNumber ?? 0"
        :channel-id="suspensionChannelId"
        :suspended-until="suspendedUntil ?? undefined"
        :suspended-indefinitely="suspendedIndefinitely"
      />
    </div>

    <template v-else>
      <header
        class="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-orange-50/70 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-orange-950/20"
      >
        <div class="p-5 sm:p-7">
          <div
            class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="flex min-w-0 items-start gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              >
                <BookIcon class="h-6 w-6" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p
                  class="text-xs font-semibold tracking-widest text-orange-700 uppercase dark:text-orange-300"
                >
                  Community knowledge
                </p>
                <h1
                  data-testid="wiki-page-title"
                  class="mt-1 text-2xl font-semibold tracking-tight wrap-anywhere wrap-break-word sm:text-3xl"
                >
                  Explore the {{ channel.displayName || forumId }} wiki
                </h1>
                <p
                  class="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base dark:text-gray-300"
                >
                  Find guides, reference pages, and knowledge shared by this
                  community.
                </p>
              </div>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-2">
              <span
                aria-live="polite"
                class="rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300"
              >
                {{ aggregateWikiPageCount }}
                {{ aggregateWikiPageCount === 1 ? 'page' : 'pages' }}
              </span>
              <RequireAuth>
                <template #has-auth>
                  <GenericButton
                    text="Add Page"
                    :disabled="wikiEditBlockedBySuspension"
                    @click="createChildWikiPage"
                  >
                    <DocumentIcon class="mr-2 h-5 w-5" />
                  </GenericButton>
                </template>
                <template #does-not-have-auth>
                  <GenericButton text="Add Page">
                    <DocumentIcon class="mr-2 h-5 w-5" />
                  </GenericButton>
                </template>
              </RequireAuth>
            </div>
          </div>

          <div
            class="mt-6 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <SearchBar
              :auto-focus="false"
              :initial-value="searchInput"
              search-placeholder="Search this wiki"
              :small="true"
              test-id="channel-wiki-search-input"
              :debounce-ms="250"
              @update-search-input="updateSearchInput"
            />
          </div>
        </div>
      </header>

      <SuspensionNotice
        v-if="showWikiEditSuspensionNotice"
        class="mt-6"
        :message="wikiEditSuspensionMessage"
        :issue-number="suspensionIssueNumber ?? 0"
        :channel-id="suspensionChannelId"
        :suspended-until="suspendedUntil ?? undefined"
        :suspended-indefinitely="suspendedIndefinitely"
      />

      <div
        v-if="!hasSearchResults"
        class="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/60"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500"
        >
          <BookIcon class="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 class="mt-4 text-base font-semibold">No wiki pages found</h2>
        <p class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          No pages match your search. Try a different phrase.
        </p>
      </div>

      <div v-else class="mt-8 space-y-10">
        <section
          v-if="showIntroduction"
          data-testid="wiki-introduction"
          class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div class="p-5 sm:p-6">
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div class="min-w-0">
                <p
                  class="text-xs font-semibold tracking-widest text-gray-500 uppercase dark:text-gray-400"
                >
                  Start here
                </p>
                <h2 class="mt-1 text-xl font-semibold wrap-anywhere">
                  {{ getPlainWikiTitle(wikiHomePage.title) }}
                </h2>
                <p
                  v-if="formatWikiExcerpt(wikiHomePage.body, 280)"
                  class="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300"
                >
                  {{ formatWikiExcerpt(wikiHomePage.body, 280) }}
                </p>
              </div>
              <RequireAuth>
                <template #has-auth>
                  <GenericButton
                    text="Edit introduction"
                    :disabled="wikiEditBlockedBySuspension"
                    @click="editWikiPage(wikiHomePage.slug)"
                  >
                    <PencilIcon class="mr-2 h-4 w-4" />
                  </GenericButton>
                </template>
                <template #does-not-have-auth>
                  <GenericButton text="Edit introduction">
                    <PencilIcon class="mr-2 h-4 w-4" />
                  </GenericButton>
                </template>
              </RequireAuth>
            </div>
            <div
              class="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-4 dark:border-gray-800"
            >
              <nuxt-link
                :to="`/forums/${forumId}/wiki/${wikiHomePage.slug}`"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:text-orange-300 dark:hover:text-orange-200"
              >
                Read the full introduction
                <ArrowUpRightIcon class="h-4 w-4" />
              </nuxt-link>
              <span
                v-if="wikiHomePage.updatedAt"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                Updated {{ relativeTime(wikiHomePage.updatedAt) }}
              </span>
            </div>
          </div>
        </section>

        <section
          v-if="pinnedWikiPages.length > 0"
          data-testid="pinned-wiki-pages"
        >
          <div class="mb-4">
            <div
              class="flex items-center gap-2 text-orange-700 dark:text-orange-300"
            >
              <StarIcon
                class="h-5 w-5"
                :filled="true"
                aria-hidden="true"
              />
              <h2 class="text-lg font-semibold">Pinned pages</h2>
            </div>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Recommended starting points from this forum.
            </p>
          </div>
          <ul class="grid gap-4 md:grid-cols-2">
            <li
              v-for="wikiPage in pinnedWikiPages"
              :key="wikiPage.id"
              class="group rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-orange-900/70 dark:from-orange-950/40 dark:to-gray-900 dark:hover:border-orange-700"
            >
              <div class="flex items-start justify-between gap-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                >
                  <StarIcon
                    class="h-3.5 w-3.5"
                    :filled="true"
                    aria-hidden="true"
                  />
                  Pinned
                </span>
                <ArrowUpRightIcon
                  class="h-5 w-5 text-gray-400 transition group-hover:text-orange-600 dark:group-hover:text-orange-300"
                />
              </div>
              <nuxt-link
                class="mt-4 block text-lg leading-6 font-semibold hover:text-orange-700 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:hover:text-orange-300"
                :to="`/forums/${forumId}/wiki/${wikiPage.slug}`"
              >
                <HighlightedSearchTerms
                  :text="getPlainWikiTitle(wikiPage.title)"
                  :search-input="searchInput"
                />
              </nuxt-link>
              <p
                v-if="formatWikiExcerpt(wikiPage.body)"
                class="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300"
              >
                {{ formatWikiExcerpt(wikiPage.body) }}
              </p>
              <div
                class="mt-5 flex flex-wrap items-center gap-3 border-t border-orange-200/70 pt-4 text-xs text-gray-600 dark:border-orange-900/60 dark:text-gray-300"
              >
                <span>{{ formatWordCount(wikiPage.body) }}</span>
                <span v-if="wikiPage.updatedAt">
                  Updated {{ relativeTime(wikiPage.updatedAt) }}
                </span>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="regularWikiPages.length > 0">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">All pages</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Browse knowledge shared by this community.
              </p>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ regularWikiPages.length }} shown
            </span>
          </div>
          <ul
            class="grid gap-4 md:grid-cols-2"
            data-testid="channel-wiki-search-results"
          >
            <li
              v-for="wikiPage in regularWikiPages"
              :key="wikiPage.id"
              data-testid="channel-wiki-card"
              class="group flex min-h-52 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-orange-700"
            >
              <div class="flex items-start justify-between gap-4">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-orange-100 group-hover:text-orange-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-orange-900/40 dark:group-hover:text-orange-300"
                >
                  <DocumentIcon class="h-5 w-5" aria-hidden="true" />
                </div>
                <ArrowUpRightIcon
                  class="h-5 w-5 text-gray-400 transition group-hover:text-orange-600 dark:group-hover:text-orange-300"
                />
              </div>
              <div class="mt-4 flex-1">
                <nuxt-link
                  class="text-base leading-6 font-semibold hover:text-orange-700 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:hover:text-orange-300"
                  :to="`/forums/${forumId}/wiki/${wikiPage.slug}`"
                >
                  <HighlightedSearchTerms
                    :text="getPlainWikiTitle(wikiPage.title)"
                    :search-input="searchInput"
                  />
                </nuxt-link>
                <p
                  v-if="formatWikiExcerpt(wikiPage.body)"
                  class="mt-2 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300"
                >
                  {{ formatWikiExcerpt(wikiPage.body) }}
                </p>
              </div>
              <div
                class="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400"
              >
                <span class="inline-flex items-center gap-1.5">
                  <DocumentIcon class="h-4 w-4" aria-hidden="true" />
                  {{ formatWordCount(wikiPage.body) }}
                </span>
                <span
                  v-if="wikiPage.VersionAuthor"
                  class="inline-flex items-center gap-1.5"
                >
                  <UserIcon class="h-4 w-4" aria-hidden="true" />
                  {{
                    wikiPage.VersionAuthor.displayName ||
                    wikiPage.VersionAuthor.username
                  }}
                </span>
                <span v-if="wikiPage.updatedAt" class="basis-full">
                  Updated {{ relativeTime(wikiPage.updatedAt) }}
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
