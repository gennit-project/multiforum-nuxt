// composables/useServerIssueList.ts
//
// Shared state + query wiring for the server-wide (admin) issue lists. The open
// and closed admin issue pages are identical except for the `isOpen` flag they
// query on, so both consume this composable and render the same IssueFilterBar.
import { computed, ref, watch } from 'vue';
import type { Issue } from '@/__generated__/graphql';
import { GET_SITE_WIDE_ISSUE_LIST } from '@/graphQLData/issue/queries';
import { useQuery } from '@vue/apollo-composable';
import { useRoute, useRouter } from 'nuxt/app';
import { getChannelLabel } from '@/utils';
import { updateFilters } from '@/utils/routerUtils';
import { getServerIssueFilterValuesFromParams } from '@/utils/getServerIssueFilterValuesFromParams';
import { useIsAuthenticated } from '@/composables/useAuthState';
import { useUIStore } from '@/stores/uiStore';
import { storeToRefs } from 'pinia';
import { getIssueSortLabel } from '@/utils/issueSortOptions';

export type SiteWideIssueListItem = Issue & {
  channelUniqueName?: string | null;
  channelIconURL?: string | null;
  authorName?: string | null;
  reportCount?: number | null;
};

export type InvolvementFilterKey =
  | 'filterCreatedByMe'
  | 'filterIAmOP'
  | 'filterIReported';

export function useServerIssueList({
  isOpen,
  scopedToForum = false,
}: {
  isOpen: boolean;
  // When true the list is scoped to the current forum (route.params.forumId):
  // channel selection is fixed to that forum and the server-rule-violations
  // filter is dropped (it is a server-admin concept). Used by the forum-scoped
  // issue pages; the admin pages leave it false.
  scopedToForum?: boolean;
}) {
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
    // In forum scope the channel is fixed to the current forum; otherwise the
    // channel chip drives a multi-channel filter.
    selectedChannels: scopedToForum
      ? [channelId.value]
      : selectedChannels.value,
    startDate: startDate.value || null,
    endDate: endDate.value || null,
    // Server-rule-violations filtering is a server-admin concept, so forum scope
    // always shows every issue in the forum.
    showOnlyServerRuleViolations: scopedToForum
      ? false
      : showOnlyServerRuleViolations.value,
    isOpen,
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
    // Forum lists refetch on mount so a freshly created issue shows when the
    // user returns to the list; the admin lists are fine with cache-first.
    fetchPolicy: scopedToForum ? 'cache-and-network' : 'cache-first',
  });

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
    key: InvolvementFilterKey;
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

  // Sync local filter state from the URL and refetch on any query change.
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

  // When navigating between forums the previously selected issue no longer
  // belongs to the current channel, so clear it. Only relevant in forum scope
  // (the admin channelId is constant, so this never fires there).
  if (scopedToForum) {
    watch(channelId, (nextChannelId, previousChannelId) => {
      if (nextChannelId !== previousChannelId) {
        uiStore.clearSelectedIssueSelection();
      }
    });
  }

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

  return {
    channelId,
    selectedChannels,
    showOnlyServerRuleViolations,
    searchInput,
    startDate,
    endDate,
    selectedSort,
    filterCreatedByMe,
    filterIAmOP,
    filterIReported,
    isAuthenticated,
    channelLabel,
    selectedSortLabel,
    issues,
    loading: getIssuesLoading,
    selectedIssueNumber,
    updateShowOnlyServerRuleViolations,
    updateSearchInput,
    updateSort,
    updateInvolvementFilter,
    toggleSelectedChannel,
    handleSelectIssue,
  };
}
