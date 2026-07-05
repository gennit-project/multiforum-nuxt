<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { GET_SITE_WIDE_ISSUE_LIST } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';
import { getChannelLabel } from '@/utils';
import { updateFilters } from '@/utils/routerUtils';
import { getServerIssueFilterValuesFromParams } from '@/utils/getServerIssueFilterValuesFromParams';
import { useIsAuthenticated } from '@/composables/useAuthState';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { getIssueSortLabel } from '@/utils/issueSortOptions';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const { selectedIssueNumber } = storeToRefs(uiStore);
const initialFilterValues = getServerIssueFilterValuesFromParams({ route });

const channelId = computed(() => {
  if (typeof route.params.forumId !== 'string') {
    return '';
  }
  return route.params.forumId;
});

const selectedChannels = ref(initialFilterValues.selectedChannels);
const showOnlyServerRuleViolations = ref(
  initialFilterValues.showOnlyServerRuleViolations
);
const searchInput = ref(initialFilterValues.searchInput);
const startDate = ref(initialFilterValues.startDate);
const endDate = ref(initialFilterValues.endDate);
const selectedSort = ref(initialFilterValues.sort);
const filterCreatedByMe = ref(initialFilterValues.filterCreatedByMe);
const filterIAmOP = ref(initialFilterValues.filterIAmOP);
const filterIReported = ref(initialFilterValues.filterIReported);
const isAuthenticated = useIsAuthenticated();
const channelLabel = computed(() => getChannelLabel(selectedChannels.value));
const selectedSortLabel = computed(() => getIssueSortLabel(selectedSort.value));

const variables = computed(() => ({
  searchInput: searchInput.value,
  selectedChannels: selectedChannels.value,
  startDate: startDate.value || null,
  endDate: endDate.value || null,
  showOnlyServerRuleViolations: showOnlyServerRuleViolations.value,
  isOpen: true,
  // Identity is resolved server-side, so these are only meaningful when the
  // viewer is authenticated; keep them false otherwise to avoid emptying the list.
  filterCreatedByMe: isAuthenticated.value && filterCreatedByMe.value,
  filterIAmOP: isAuthenticated.value && filterIAmOP.value,
  filterIReported: isAuthenticated.value && filterIReported.value,
  options: {
    sort: selectedSort.value,
  },
}));

const {
  result: getIssuesResult,
  error: getIssuesError,
  loading: getIssuesLoading,
  refetch,
} = useQuery(GET_SITE_WIDE_ISSUE_LIST, variables, {
  fetchPolicy: 'cache-first',
});

type SiteWideIssueListItem = Issue & {
  channelUniqueName?: string | null;
  channelIconURL?: string | null;
  authorName?: string | null;
  reportCount?: number | null;
};

const issues = computed<SiteWideIssueListItem[]>(() => {
  if (getIssuesLoading.value || getIssuesError.value) {
    return [];
  }
  return getIssuesResult.value?.getSiteWideIssueList?.issues || [];
});

const updateShowOnlyServerRuleViolations = (value: boolean) => {
  showOnlyServerRuleViolations.value = value;
  updateFilters({
    router,
    route,
    params: {
      showOnlyServerRuleViolations: value,
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

const updateSort = (value: string) => {
  updateFilters({
    router,
    route,
    params: { sort: value },
  });
};

const updateInvolvementFilter = (payload: {
  key: 'filterCreatedByMe' | 'filterIAmOP' | 'filterIReported';
  value: boolean;
}) => {
  updateFilters({
    router,
    route,
    params: { [payload.key]: payload.value },
  });
};

const toggleSelectedChannel = (channel: string) => {
  const nextChannels = [...selectedChannels.value];
  const selectedIndex = nextChannels.indexOf(channel);

  if (selectedIndex >= 0) {
    nextChannels.splice(selectedIndex, 1);
  } else {
    nextChannels.push(channel);
  }

  updateFilters({
    router,
    route,
    params: {
      channels: nextChannels,
    },
  });
};

const handleSelectIssue = (payload: {
  issueNumber: number;
  title: string;
  channelId: string;
}) => {
  uiStore.setSelectedIssueSelection(payload);
};

// Watch for route change to update showOnlyServerRuleViolations and refetch
watch(
  () => route.query,
  () => {
    const nextFilterValues = getServerIssueFilterValuesFromParams({ route });

    selectedChannels.value = nextFilterValues.selectedChannels;
    showOnlyServerRuleViolations.value =
      nextFilterValues.showOnlyServerRuleViolations;
    searchInput.value = nextFilterValues.searchInput;
    selectedSort.value = nextFilterValues.sort;
    filterCreatedByMe.value = nextFilterValues.filterCreatedByMe;
    filterIAmOP.value = nextFilterValues.filterIAmOP;
    filterIReported.value = nextFilterValues.filterIReported;

    if (nextFilterValues.startDate !== startDate.value) {
      startDate.value = nextFilterValues.startDate;
    }
    if (nextFilterValues.endDate !== endDate.value) {
      endDate.value = nextFilterValues.endDate;
    }
    refetch(variables.value);
  }
);

watch([startDate, endDate], ([nextStartDate, nextEndDate]) => {
  if (
    route.query.startDate === nextStartDate &&
    route.query.endDate === nextEndDate
  ) {
    return;
  }

  updateFilters({
    router,
    route,
    params: {
      startDate: nextStartDate,
      endDate: nextEndDate,
    },
  });
});
</script>

<template>
  <div>
    <IssueFilterBar
      :search-input="searchInput"
      :selected-channels="selectedChannels"
      :channel-label="channelLabel"
      :start-date="startDate"
      :end-date="endDate"
      :show-only-server-rule-violations="showOnlyServerRuleViolations"
      :selected-sort="selectedSort"
      :selected-sort-label="selectedSortLabel"
      :show-involvement-filters="isAuthenticated"
      :filter-created-by-me="filterCreatedByMe"
      :filter-i-am-o-p="filterIAmOP"
      :filter-i-reported="filterIReported"
      @update-search-input="updateSearchInput"
      @toggle-selected-channel="toggleSelectedChannel"
      @update:sort="updateSort"
      @update:start-date="startDate = $event"
      @update:end-date="endDate = $event"
      @update:show-only-server-rule-violations="
        updateShowOnlyServerRuleViolations
      "
      @update:involvement-filter="updateInvolvementFilter"
    />
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
          :show-status-icon="false"
          @select="handleSelectIssue"
        />
    </ul>
  </div>
</template>
