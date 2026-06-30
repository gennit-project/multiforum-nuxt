<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { GET_ISSUES } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import { getChannelLabel } from '@/utils';
import { updateFilters } from '@/utils/routerUtils';
import {
  getDefaultServerRuleViolationsFilter,
  buildServerIssuesWhere,
  isDateInputValue,
} from '@/utils/serverIssueFilters';
import { useSelectedChannelsFromQuery } from '@/composables/useSelectedChannelsFromQuery';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const uiStore = useUIStore();
const { selectedIssueNumber } = storeToRefs(uiStore);
const { selectedChannels } = useSelectedChannelsFromQuery();
const toDateInputValue = (date: Date) =>
  date.toISOString().split('T')[0] || '';
const getQueryString = (value: unknown) => {
  return typeof value === 'string' && value ? value : null;
};
const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - 30);
const defaultStartDate = toDateInputValue(defaultStart);
const defaultEndDate = toDateInputValue(today);

const channelId = computed(() => {
  if (typeof route.params.forumId !== 'string') {
    return '';
  }
  return route.params.forumId;
});

const showOnlyServerRuleViolations = ref(
  getDefaultServerRuleViolationsFilter(route.query.showOnlyServerRuleViolations)
);
const searchInput = ref(
  typeof route.query.searchInput === 'string' ? route.query.searchInput : ''
);
const startDate = ref(
  isDateInputValue(getQueryString(route.query.startDate))
    ? getQueryString(route.query.startDate) || defaultStartDate
    : defaultStartDate
);
const endDate = ref(
  isDateInputValue(getQueryString(route.query.endDate))
    ? getQueryString(route.query.endDate) || defaultEndDate
    : defaultEndDate
);
const channelLabel = computed(() => getChannelLabel(selectedChannels.value));

const variables = computed(() =>
  buildServerIssuesWhere({
    searchInput: searchInput.value,
    selectedChannels: selectedChannels.value,
    startDate: startDate.value,
    endDate: endDate.value,
    showOnlyServerRuleViolations: showOnlyServerRuleViolations.value,
  })
);

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
    if (route.query) {
      const nextStartDate = getQueryString(route.query.startDate);
      const nextEndDate = getQueryString(route.query.endDate);

      showOnlyServerRuleViolations.value =
        getDefaultServerRuleViolationsFilter(
          route.query.showOnlyServerRuleViolations
        );
      searchInput.value =
        typeof route.query.searchInput === 'string'
          ? route.query.searchInput
          : '';
      if (isDateInputValue(nextStartDate) && nextStartDate !== startDate.value) {
        startDate.value = nextStartDate;
      }
      if (isDateInputValue(nextEndDate) && nextEndDate !== endDate.value) {
        endDate.value = nextEndDate;
      }
      refetch(variables.value);
    }
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
    <div class="flex flex-col gap-3 pb-4">
      <SearchBar
        :initial-value="searchInput"
        :search-placeholder="'Search issues'"
        :test-id="'server-issue-search-input'"
        :debounce-ms="500"
        @update-search-input="updateSearchInput"
      />
      <div class="flex flex-wrap items-end gap-3">
        <label
          class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          Start
          <input
            v-model="startDate"
            type="date"
            data-testid="admin-issues-start-date"
            class="rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          >
        </label>
        <label
          class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
        >
          End
          <input
            v-model="endDate"
            type="date"
            data-testid="admin-issues-end-date"
            class="rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          >
        </label>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <FilterChip
          :label="channelLabel"
          :highlighted="selectedChannels.length > 0"
          data-testid="admin-issues-channel-filter"
        >
          <template #icon>
            <ChannelIcon class="-ml-0.5 mr-2 h-4 w-4" />
          </template>
          <template #content>
            <div class="relative w-96">
              <SearchableForumList
                :selected-channels="selectedChannels"
                @toggle-selection="toggleSelectedChannel"
              />
            </div>
          </template>
        </FilterChip>
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
          :is-selectable="true"
          :selected-issue-number="selectedIssueNumber ?? undefined"
          :show-status-icon="false"
          @select="handleSelectIssue"
        />
    </ul>
  </div>
</template>
