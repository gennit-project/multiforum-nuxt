<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { GET_ISSUES } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import SearchBar from '@/components/SearchBar.vue';
import { updateFilters } from '@/utils/routerUtils';

const route = useRoute();
const router = useRouter();

const channelId = computed(() => {
  if (typeof route.params.forumId !== 'string') {
    return '';
  }
  return route.params.forumId;
});

const getDefaultFilter = () => {
  // If there is no query param at all, the default should be true.
  // If the query param is given as false, that overrides that.

  if (route.query.showOnlyServerRuleViolations === 'false') {
    return false;
  }
  return true;
};
const showOnlyServerRuleViolations = ref(getDefaultFilter());
const searchInput = ref(
  typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
);

const variables = computed(() => {
  const trimmedSearch = searchInput.value.trim();
  const searchFilter = trimmedSearch
    ? {
        OR: [
          { title_CONTAINS: trimmedSearch },
          { body_CONTAINS: trimmedSearch },
        ],
      }
    : {};

  if (showOnlyServerRuleViolations.value) {
    return {
      issueWhere: {
        isOpen: true,
        flaggedServerRuleViolation: true,
        ...searchFilter,
      },
    };
  }
  return {
    issueWhere: {
      isOpen: true,
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

const toggleShowOnlyServerRuleViolations = () => {
  showOnlyServerRuleViolations.value = !showOnlyServerRuleViolations.value;
  updateFilters({
    router,
    route,
    params: {
      showOnlyServerRuleViolations: showOnlyServerRuleViolations.value,
    },
  });
};

const updateSearchInput = (value: string) => {
  updateFilters({
    router,
    route,
    params: { searchInput: value },
  });
};

// Watch for route change to update showOnlyServerRuleViolations and refetch
watch(
  () => route.query,
  () => {
    if (route.query) {
      showOnlyServerRuleViolations.value =
        route.query.showOnlyServerRuleViolations === 'true';
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
        :search-placeholder="'Search issues'"
        :test-id="'server-issue-search-input'"
        :debounce-ms="500"
        @update-search-input="updateSearchInput"
      />
      <div class="flex items-center justify-end">
        <input
          id="show-only-server-rule-violations"
          type="checkbox"
          :checked="showOnlyServerRuleViolations"
          class="mr-2"
          data-testid="show-only-server-rule-violations"
          @change="toggleShowOnlyServerRuleViolations"
        >
        <label for="show-only-server-rule-violations" class="mr-2"
          >Show only server rule violations</label
        >
      </div>
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
      />
    </ul>
  </div>
</template>
