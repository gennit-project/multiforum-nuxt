<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { GET_CLOSED_ISSUES_BY_CHANNEL } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import { updateFilters } from '@/utils/routerUtils';
import SearchBar from '@/components/SearchBar.vue';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId !== 'string') {
    return '';
  }
  return route.params.forumId;
});

const searchInput = ref(
  typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
);

const queryVariables = computed(() => ({
  channelUniqueName: channelId.value,
  searchInput: searchInput.value.trim(),
}));

const {
  result: getClosedIssuesByChannelResult,
  error: getClosedIssuesByChannelError,
  loading: getClosedIssuesByChannelLoading,
  refetch: refetchClosedIssues,
} = useQuery(GET_CLOSED_ISSUES_BY_CHANNEL, queryVariables);

const closedIssues = computed<Issue[]>(() => {
  if (
    getClosedIssuesByChannelLoading.value ||
    getClosedIssuesByChannelError.value
  ) {
    return [];
  }
  const channelData = getClosedIssuesByChannelResult.value?.channels?.[0];

  if (!channelData || !channelData.Issues) {
    return [];
  }
  return channelData.Issues;
});

const updateSearchInput = (value: string) => {
  updateFilters({
    router,
    route,
    params: { searchInput: value },
  });
};

watch(
  () => route.query,
  () => {
    searchInput.value =
      typeof route.query.searchInput === 'string'
        ? route.query.searchInput
        : '';
    refetchClosedIssues(queryVariables.value);
  }
);
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-800 dark:text-white">
    <div class="px-4 py-4">
      <SearchBar
        :initial-value="searchInput"
        :search-placeholder="'Search closed issues'"
        :test-id="'closed-issue-search-input'"
        :debounce-ms="500"
        @update-search-input="updateSearchInput"
      />
    </div>
    <div
      v-if="!getClosedIssuesByChannelLoading && closedIssues.length === 0"
      class="px-4 py-6 text-sm text-gray-600 dark:text-gray-300"
    >
      There are no closed issues.
    </div>
    <ul class="divide-y" data-testid="issue-list">
      <ModIssueListItem
        v-for="issue in closedIssues"
        :key="issue.id"
        :issue="issue"
        :channel-id="channelId"
      />
    </ul>
  </div>
</template>
