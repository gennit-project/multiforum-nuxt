<script lang="ts" setup>
// Server-wide (server-scoped) issue list body: the filter bar plus the list of
// issues. Shared by the admin issue pages (/admin/issues) and the public
// transparency pages (/server/issues) so the two stay DRY — the only
// difference between the open and closed variants is the `isOpen` flag and the
// search placeholder/test id.
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';
import { useServerIssueList } from '@/composables/useServerIssueList';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    searchPlaceholder?: string;
    searchTestId?: string;
  }>(),
  {
    searchPlaceholder: undefined,
    searchTestId: undefined,
  }
);

const {
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
  selectedIssueNumber,
  updateShowOnlyServerRuleViolations,
  updateSearchInput,
  updateSort,
  updateInvolvementFilter,
  toggleSelectedChannel,
  handleSelectIssue,
} = useServerIssueList({ isOpen: props.isOpen });
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
      :search-placeholder="searchPlaceholder"
      :search-test-id="searchTestId"
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
