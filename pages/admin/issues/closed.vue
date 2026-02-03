<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { GET_ISSUES } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import SearchBar from '@/components/SearchBar.vue';
import { updateFilters } from '@/utils/routerUtils';
import { createCaseInsensitivePattern } from '@/utils/searchUtils';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const { selectedIssueNumber } = storeToRefs(uiStore);

const channelId = computed(() => {
  if (typeof route.params.forumId !== 'string') {
    return '';
  }
  return route.params.forumId;
});

const searchInput = ref(
  typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
);

const variables = computed(() => {
  const searchPattern = createCaseInsensitivePattern(searchInput.value);
  const searchFilter = searchPattern
    ? {
        OR: [
          { title_MATCHES: searchPattern },
          { body_MATCHES: searchPattern },
        ],
      }
    : {};

  return {
    issueWhere: {
      isOpen: false,
      ...searchFilter,
    },
  };
});

const {
  result: getIssuesResult,
  error: getIssuesError,
  loading: getIssuesLoading,
  refetch,
} = useQuery(GET_ISSUES, variables, {
  fetchPolicy: 'cache-first',
});

const issues = computed<Issue[]>(() => {
  if (getIssuesLoading.value || getIssuesError.value) {
    return [];
  }
  return getIssuesResult.value?.issues || [];
});

const updateSearchInput = (value: string) => {
  updateFilters({
    router,
    route,
    params: { searchInput: value },
  });
};

const handleSelectIssue = (payload: {
  issueNumber: number;
  title: string;
  channelId: string;
}) => {
  uiStore.setSelectedIssueSelection(payload);
};

// Watch for route change to update searchInput and refetch
watch(
  () => route.query,
  () => {
    if (route.query) {
      searchInput.value =
        typeof route.query.searchInput === 'string'
          ? route.query.searchInput
          : '';
      refetch(variables.value);
    }
  }
);
</script>

<template>
  <div>
    <div class="flex flex-col gap-3 pb-4">
      <SearchBar
        :initial-value="searchInput"
        :search-placeholder="'Search closed issues'"
        :test-id="'closed-issue-search-input'"
        :debounce-ms="500"
        @update-search-input="updateSearchInput"
      />
    </div>
    <ul
      class="divide-y border-t border-gray-200 dark:border-gray-800 dark:text-white"
      data-testid="issue-list"
    >
        <ModIssueListItem
          v-for="issue in issues"
          :key="issue.id"
          :issue="issue"
          :channel-id="channelId"
          :is-selectable="true"
          :selected-issue-number="selectedIssueNumber ?? undefined"
          @select="handleSelectIssue"
        />
    </ul>
  </div>
</template>
