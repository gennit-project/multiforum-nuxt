<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter, useHead } from 'nuxt/app';
import SearchBar from '@/components/SearchBar.vue';
import { updateFilters } from '@/utils/routerUtils';

const route = useRoute();
const router = useRouter();

const searchInput = computed(() =>
  typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
);

const modified = computed(() =>
  typeof route.query.modified === 'string' ? route.query.modified : 'all'
);

const selectedChannels = computed(() => {
  const channels = route.query.channels;
  if (typeof channels === 'string') {
    return [channels];
  }
  if (Array.isArray(channels)) {
    return channels.filter(
      (value): value is string => typeof value === 'string'
    );
  }
  return [];
});

const modifiedLabel = computed(() => {
  const labels: Record<string, string> = {
    all: 'All',
    last7: 'Last 7 days',
    last30: 'Last 30 days',
    thisYear: 'This year',
    lastYear: 'Last year',
  };
  return labels[modified.value] ?? 'All';
});

const channelsLabel = computed(() =>
  selectedChannels.value.length
    ? selectedChannels.value.join(', ')
    : 'All forums'
);

const pageTitle = computed(() => {
  const serverName = import.meta.env.VITE_SERVER_DISPLAY_NAME;
  return `Comment search | ${serverName}`;
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
</script>

<template>
  <NuxtLayout>
    <div class="mx-auto max-w-3xl px-4 py-6 text-gray-900 dark:text-gray-100">
      <h1 class="font-semibold text-lg">Comment search</h1>
      <div class="mt-4">
        <SearchBar
          :auto-focus="shouldAutoFocus"
          :initial-value="searchInput"
          :search-placeholder="'Search comments'"
          :small="true"
          :test-id="'comment-search-input'"
          :debounce-ms="0"
          @update-search-input="updateSearchInput"
        />
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
        Comment search results are not wired up yet.
      </p>
      <div
        class="mt-4 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      >
        <div class="font-medium text-gray-900 dark:text-gray-100">
          Search term:
          <span v-if="searchInput">"{{ searchInput }}"</span>
          <span v-else class="text-gray-500 dark:text-gray-400">None</span>
        </div>
        <div class="mt-3 text-xs uppercase tracking-wide text-gray-500">
          Filters
        </div>
        <div class="mt-1">Modified: {{ modifiedLabel }}</div>
        <div>Forums: {{ channelsLabel }}</div>
      </div>
    </div>
  </NuxtLayout>
</template>
