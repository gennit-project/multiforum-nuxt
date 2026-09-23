<script setup lang="ts">
import { config } from '@/config';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ArrowUpRightIcon from '@/components/icons/ArrowUpRightIcon.vue';
import BookIcon from '@/components/icons/BookIcon.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import DocumentIcon from '@/components/icons/DocumentIcon.vue';
import StarIcon from '@/components/icons/StarIcon.vue';
import UserIcon from '@/components/icons/UserIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { updateFilters } from '@/utils/routerUtils';
import { getChannelLabel, relativeTime } from '@/utils';
import { getDiscussionFilterValuesFromParams } from '@/utils/getDiscussionFilterValuesFromParams';
import { GET_SITE_WIDE_WIKI_LIST } from '@/graphQLData/wiki/queries';
import { formatWikiExcerpt, formatWordCount } from '@/utils/wikiSearchDisplay';
import { getPlainWikiTitle } from '@/utils/wikiTitle';

const WIKI_PAGE_LIMIT = 25;

type WikiSearchPage = {
  id: string;
  title?: string | null;
  body?: string | null;
  slug?: string | null;
  channelUniqueName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  VersionAuthor?: {
    username?: string | null;
    displayName?: string | null;
    profilePicURL?: string | null;
  } | null;
};

const route = useRoute();
const router = useRouter();

const filterValues = ref(
  getDiscussionFilterValuesFromParams({
    route,
    channelId: '',
  })
);

const searchInputComputed = computed(
  () => filterValues.value.searchInput || ''
);
const selectedChannelsComputed = computed(
  () => filterValues.value.channels || []
);

const channelLabel = computed(() =>
  getChannelLabel(filterValues.value.channels || [])
);

const pageTitle = computed(() => {
  return `Wiki search | ${config.serverDisplayName}`;
});

useHead({
  title: pageTitle,
});

const shouldAutoFocus = computed(() => route.query.searchOpen === 'true');

const updateSearchInput = (value: string) => {
  updateFilters({
    router,
    route,
    params: {
      searchInput: value,
      searchOpen: 'true',
    },
  });
};

const toggleSelectedChannel = (channel: string) => {
  if (!filterValues.value.channels) {
    filterValues.value.channels = [];
  }
  const index = filterValues.value.channels.indexOf(channel);
  if (index === -1) {
    filterValues.value.channels.push(channel);
  } else {
    filterValues.value.channels.splice(index, 1);
  }
  updateFilters({
    router,
    route,
    params: { channels: filterValues.value.channels },
  });
};

const {
  result: wikiResult,
  loading: wikiLoading,
  error: wikiError,
} = useQuery(GET_SITE_WIDE_WIKI_LIST, {
  searchInput: searchInputComputed,
  selectedChannels: selectedChannelsComputed,
  options: {
    limit: WIKI_PAGE_LIMIT,
    offset: 0,
  },
});

const wikiPages = computed<WikiSearchPage[]>(() => {
  if (!wikiResult.value?.getSiteWideWikiList) {
    return [];
  }
  return (wikiResult.value.getSiteWideWikiList.wikiPages ||
    []) as WikiSearchPage[];
});

const featuredWikiPages = computed<WikiSearchPage[]>(() => {
  if (!wikiResult.value?.getSiteWideWikiList) {
    return [];
  }
  return (wikiResult.value.getSiteWideWikiList.featuredWikiPages ||
    []) as WikiSearchPage[];
});

const regularWikiPages = computed<WikiSearchPage[]>(() => {
  const featuredIds = new Set(featuredWikiPages.value.map((page) => page.id));
  return wikiPages.value.filter((page) => !featuredIds.has(page.id));
});

const aggregateWikiPageCount = computed(() => {
  if (!wikiResult.value?.getSiteWideWikiList) {
    return 0;
  }
  return wikiResult.value.getSiteWideWikiList.aggregateWikiPageCount || 0;
});

watch(
  () => route.query,
  () => {
    filterValues.value = getDiscussionFilterValuesFromParams({
      route,
      channelId: '',
    });
  }
);
</script>

<template>
  <NuxtLayout>
    <div
      class="mx-auto w-full max-w-6xl px-4 py-6 text-gray-900 sm:px-6 sm:py-8 lg:px-8 dark:text-gray-100"
    >
      <header
        class="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-orange-50/70 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-orange-950/20"
      >
        <div class="p-5 sm:p-7">
          <div
            class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              >
                <BookIcon class="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p
                  class="text-xs font-semibold tracking-widest text-orange-700 uppercase dark:text-orange-300"
                >
                  Community knowledge
                </p>
                <h1
                  class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl"
                >
                  Explore the wiki
                </h1>
                <p
                  class="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base dark:text-gray-300"
                >
                  Find guides, reference pages, and shared knowledge from every
                  forum.
                </p>
              </div>
            </div>
            <div
              aria-live="polite"
              class="w-fit shrink-0 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-300"
            >
              {{ aggregateWikiPageCount }}
              {{ aggregateWikiPageCount === 1 ? 'page' : 'pages' }}
            </div>
          </div>

          <div
            class="mt-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center dark:border-gray-700 dark:bg-gray-900"
          >
            <div class="min-w-0 flex-1">
              <SearchBar
                :auto-focus="shouldAutoFocus"
                :initial-value="searchInputComputed"
                :search-placeholder="'Search wiki'"
                :small="true"
                :test-id="'wiki-search-input'"
                :debounce-ms="0"
                @update-search-input="updateSearchInput"
              />
            </div>
            <FilterChip :label="channelLabel">
              <template #icon>
                <ChannelIcon class="mr-2 -ml-0.5 h-4 w-4" />
              </template>
              <template #content>
                <div class="relative w-96 max-w-[calc(100vw-2rem)]">
                  <SearchableForumList
                    :selected-channels="filterValues.channels"
                    @toggle-selection="toggleSelectedChannel"
                  />
                </div>
              </template>
            </FilterChip>
          </div>
        </div>
      </header>

      <div v-if="wikiLoading" class="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
      <div
        v-else-if="wikiError"
        class="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
      >
        {{ wikiError.message }}
      </div>
      <div
        v-else-if="wikiPages.length === 0 && featuredWikiPages.length === 0"
        class="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900/60"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500"
        >
          <BookIcon class="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 class="mt-4 text-base font-semibold">No wiki pages found</h2>
        <p class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          No wiki pages match your search. Try a different phrase or broaden the
          forum filter.
        </p>
      </div>
      <div v-else class="mt-8 space-y-10">
        <section
          v-if="featuredWikiPages.length > 0"
          data-testid="featured-wiki-pages"
        >
          <div class="mb-4 flex items-end justify-between gap-4">
            <div>
              <div
                class="flex items-center gap-2 text-orange-700 dark:text-orange-300"
              >
                <StarIcon class="h-5 w-5" :filled="true" aria-hidden="true" />
                <h2 class="text-lg font-semibold">Featured</h2>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Curated starting points from the server admins.
              </p>
            </div>
          </div>
          <ul class="grid gap-4 md:grid-cols-2">
            <li
              v-for="wikiPage in featuredWikiPages"
              :key="wikiPage.id"
              class="group relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-orange-900/70 dark:from-orange-950/40 dark:to-gray-900 dark:hover:border-orange-700"
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
                  Featured
                </span>
                <ArrowUpRightIcon
                  class="h-5 w-5 text-gray-400 transition group-hover:text-orange-600 dark:group-hover:text-orange-300"
                  aria-hidden="true"
                />
              </div>
              <div class="mt-4">
                <nuxt-link
                  class="text-lg leading-6 font-semibold text-gray-900 hover:text-orange-700 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:text-gray-100 dark:hover:text-orange-300"
                  :to="`/forums/${wikiPage.channelUniqueName}/wiki/${wikiPage.slug}`"
                >
                  <HighlightedSearchTerms
                    :text="getPlainWikiTitle(wikiPage.title) || undefined"
                    :search-input="searchInputComputed"
                  />
                </nuxt-link>
              </div>
              <p
                v-if="formatWikiExcerpt(wikiPage.body)"
                class="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300"
              >
                {{ formatWikiExcerpt(wikiPage.body) }}
              </p>
              <div
                class="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-orange-200/70 pt-4 text-xs text-gray-600 dark:border-orange-900/60 dark:text-gray-300"
              >
                <span class="inline-flex items-center gap-1.5 font-medium">
                  <ChannelIcon class="h-4 w-4" aria-hidden="true" />
                  {{ wikiPage.channelUniqueName }}
                </span>
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
              <h2 class="text-lg font-semibold">All wiki pages</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Browse knowledge shared across the community.
              </p>
            </div>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ regularWikiPages.length }} shown
            </span>
          </div>
          <ul
            class="grid gap-4 md:grid-cols-2"
            data-testid="wiki-search-results"
          >
            <li
              v-for="wikiPage in regularWikiPages"
              :key="wikiPage.id"
              data-testid="wiki-search-card"
              class="group relative flex min-h-52 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-orange-700"
            >
              <div class="flex items-start justify-between gap-4">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition group-hover:bg-orange-100 group-hover:text-orange-700 dark:bg-gray-800 dark:text-gray-400 dark:group-hover:bg-orange-900/40 dark:group-hover:text-orange-300"
                >
                  <DocumentIcon class="h-5 w-5" aria-hidden="true" />
                </div>
                <ArrowUpRightIcon
                  class="h-5 w-5 text-gray-400 transition group-hover:text-orange-600 dark:group-hover:text-orange-300"
                  aria-hidden="true"
                />
              </div>
              <div class="mt-4 flex-1">
                <nuxt-link
                  class="text-base leading-6 font-semibold text-gray-900 hover:text-orange-700 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none dark:text-gray-100 dark:hover:text-orange-300"
                  :to="`/forums/${wikiPage.channelUniqueName}/wiki/${wikiPage.slug}`"
                >
                  <HighlightedSearchTerms
                    :text="getPlainWikiTitle(wikiPage.title) || undefined"
                    :search-input="searchInputComputed"
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
                <span class="inline-flex items-center gap-1.5 font-medium">
                  <ChannelIcon class="h-4 w-4" aria-hidden="true" />
                  {{ wikiPage.channelUniqueName }}
                </span>
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
    </div>
  </NuxtLayout>
</template>
