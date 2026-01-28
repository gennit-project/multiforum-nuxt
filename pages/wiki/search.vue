<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import { useQuery } from '@vue/apollo-composable';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import HighlightedSearchTerms from '@/components/HighlightedSearchTerms.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import { updateFilters } from '@/utils/routerUtils';
import { getChannelLabel } from '@/utils';
import { getFilterValuesFromParams } from '@/components/discussion/list/getDiscussionFilterValuesFromParams';
import { GET_SITE_WIDE_WIKI_LIST } from '@/graphQLData/wiki/queries';

const WIKI_PAGE_LIMIT = 25;

const route = useRoute();
const router = useRouter();

const filterValues = ref(
  getFilterValuesFromParams({
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
  const serverName =
    import.meta.env.VITE_SERVER_DISPLAY_NAME ||
    import.meta.env.VITE_SERVER_NAME ||
    'Multiforum';
  return `Wiki search | ${serverName}`;
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

const wikiPages = computed(() => {
  if (!wikiResult.value?.getSiteWideWikiList) {
    return [];
  }
  return wikiResult.value.getSiteWideWikiList.wikiPages || [];
});

const aggregateWikiPageCount = computed(() => {
  if (!wikiResult.value?.getSiteWideWikiList) {
    return 0;
  }
  return wikiResult.value.getSiteWideWikiList.aggregateWikiPageCount || 0;
});

const getSnippet = (body: string | null | undefined) => {
  if (!body) {
    return '';
  }
  return body.length > 180 ? `${body.slice(0, 180)}...` : body;
};

watch(
  () => route.query,
  () => {
    filterValues.value = getFilterValuesFromParams({
      route,
      channelId: '',
    });
  }
);
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto max-w-4xl px-4 py-6 text-gray-900 dark:text-gray-100">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="font-semibold text-lg">Wiki search</h1>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ aggregateWikiPageCount }} results
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <div class="min-w-[220px] flex-1">
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
            <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <div class="relative w-96">
              <SearchableForumList
                :selected-channels="filterValues.channels"
                @toggle-selection="toggleSelectedChannel"
              />
            </div>
          </template>
        </FilterChip>
      </div>

      <div v-if="wikiLoading" class="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
      <div
        v-else-if="wikiError"
        class="bg-red-50 mt-6 rounded-md border border-red-200 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
      >
        {{ wikiError.message }}
      </div>
      <div
        v-else-if="wikiPages.length === 0"
        class="mt-6 text-sm text-gray-500"
      >
        No wiki pages match your search.
      </div>
      <ul
        v-else
        class="mt-6 flex flex-col gap-4"
        data-testid="wiki-search-results"
      >
        <li
          v-for="wikiPage in wikiPages"
          :key="wikiPage.id"
          class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <nuxt-link
              class="font-semibold text-base text-gray-900 hover:text-orange-600 dark:text-gray-100"
              :to="`/forums/${wikiPage.channelUniqueName}/wiki/${wikiPage.slug}`"
            >
              <HighlightedSearchTerms
                :text="wikiPage.title"
                :search-input="searchInputComputed"
              />
            </nuxt-link>
            <span class="text-xs text-gray-500 dark:text-gray-300">
              {{ wikiPage.channelUniqueName }}
            </span>
          </div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <HighlightedSearchTerms
              :text="getSnippet(wikiPage.body)"
              :search-input="searchInputComputed"
            />
          </p>
          <div
            v-if="wikiPage.VersionAuthor"
            class="mt-3 text-xs text-gray-500 dark:text-gray-300"
          >
            Updated by
            {{
              wikiPage.VersionAuthor.displayName ||
              wikiPage.VersionAuthor.username
            }}
          </div>
        </li>
      </ul>
    </div>
  </NuxtLayout>
</template>
