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
  buildServerIssuesWhere,
} from '@/utils/serverIssueFilters';
import { getServerIssueFilterValuesFromParams } from '@/utils/getServerIssueFilterValuesFromParams';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';

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
    const nextFilterValues = getServerIssueFilterValuesFromParams({ route });

    selectedChannels.value = nextFilterValues.selectedChannels;
    showOnlyServerRuleViolations.value =
      nextFilterValues.showOnlyServerRuleViolations;
    searchInput.value = nextFilterValues.searchInput;

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
    <div class="flex flex-col gap-3 px-4 pb-4">
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
