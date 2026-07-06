<script setup lang="ts">
import ModIssueListItem from '@/components/mod/ModIssueListItem.vue';
import IssueFilterBar from '@/components/admin/IssueFilterBar.vue';
import { useServerIssueList } from '@/composables/useServerIssueList';

const {
  channelId,
  selectedChannels,
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
  loading,
  selectedIssueNumber,
  showOnlyServerRuleViolations,
  updateSearchInput,
  updateSort,
  updateInvolvementFilter,
  toggleSelectedChannel,
  updateShowOnlyServerRuleViolations,
  handleSelectIssue,
} = useServerIssueList({ isOpen: false, scopedToForum: true });
</script>

<template>
  <div class="border-t border-gray-200 dark:border-gray-800 dark:text-white">
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
      :search-placeholder="'Search closed issues'"
      :search-test-id="'closed-issue-search-input'"
      :show-channel-filter="false"
      :show-server-rule-violations-filter="false"
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
    <div
      v-if="!loading && issues.length === 0"
      class="px-4 py-6 text-sm text-gray-600 dark:text-gray-300"
    >
      There are no closed issues.
    </div>
    <ul class="divide-y" data-testid="issue-list">
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
