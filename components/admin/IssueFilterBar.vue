<script lang="ts" setup>
import { computed } from 'vue';
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';
import TextButtonDropdown from '@/components/TextButtonDropdown.vue';
import { issueSortOptions, type IssueSortValue } from '@/utils/issueSortOptions';

type InvolvementFilterKey =
  | 'filterCreatedByMe'
  | 'filterIAmOP'
  | 'filterIReported';

const props = defineProps<{
  searchInput: string;
  selectedChannels: string[];
  channelLabel: string;
  startDate: string;
  endDate: string;
  showOnlyServerRuleViolations: boolean;
  selectedSort: IssueSortValue;
  selectedSortLabel: string;
  showInvolvementFilters?: boolean;
  filterCreatedByMe?: boolean;
  filterIAmOP?: boolean;
  filterIReported?: boolean;
  searchPlaceholder?: string;
  searchTestId?: string;
}>();

const searchPlaceholder = computed(
  () => props.searchPlaceholder ?? 'Search issues'
);
const searchTestId = computed(
  () => props.searchTestId ?? 'server-issue-search-input'
);

const emit = defineEmits<{
  'update-search-input': [value: string];
  'update:startDate': [value: string];
  'update:endDate': [value: string];
  'toggle-selected-channel': [channel: string];
  'update:showOnlyServerRuleViolations': [value: boolean];
  'update:sort': [value: string];
  'update:involvementFilter': [
    payload: { key: InvolvementFilterKey; value: boolean },
  ];
}>();

const involvementFilters = computed<
  { key: InvolvementFilterKey; label: string; checked: boolean }[]
>(() => [
  {
    key: 'filterCreatedByMe',
    label: 'Created by me',
    checked: Boolean(props.filterCreatedByMe),
  },
  {
    key: 'filterIAmOP',
    label: 'About my content',
    checked: Boolean(props.filterIAmOP),
  },
  {
    key: 'filterIReported',
    label: 'I reported',
    checked: Boolean(props.filterIReported),
  },
]);

const issueScopeOptions = [
  {
    label: 'All issues',
    value: 'all',
  },
  {
    label: 'Server rule violations',
    value: 'serverRuleViolations',
  },
];

const issueScopeLabel = computed(() =>
  props.showOnlyServerRuleViolations ? 'Server rule violations' : 'All issues'
);
</script>

<template>
  <div class="flex flex-col gap-3 px-4 pb-4">
    <SearchBar
      :initial-value="searchInput"
      :search-placeholder="searchPlaceholder"
      :test-id="searchTestId"
      :debounce-ms="500"
      @update-search-input="emit('update-search-input', $event)"
    />
    <div class="flex flex-wrap items-end gap-3">
      <label
        class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
      >
        Start
        <input
          :value="startDate"
          type="date"
          data-testid="admin-issues-start-date"
          class="rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          @input="
            emit(
              'update:startDate',
              ($event.target as HTMLInputElement).value
            )
          "
        >
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-medium text-gray-600 dark:text-gray-300"
      >
        End
        <input
          :value="endDate"
          type="date"
          data-testid="admin-issues-end-date"
          class="rounded-md border-gray-300 px-2 py-1 text-sm text-gray-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:[color-scheme:dark]"
          @input="
            emit(
              'update:endDate',
              ($event.target as HTMLInputElement).value
            )
          "
        >
      </label>
    </div>
    <div
      v-if="showInvolvementFilters"
      class="flex flex-wrap items-center gap-4"
      data-testid="issue-involvement-filters"
    >
      <label
        v-for="filter in involvementFilters"
        :key="filter.key"
        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
      >
        <input
          type="checkbox"
          :checked="filter.checked"
          :data-testid="`issue-filter-${filter.key}`"
          class="rounded border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900"
          @change="
            emit('update:involvementFilter', {
              key: filter.key,
              value: ($event.target as HTMLInputElement).checked,
            })
          "
        >
        {{ filter.label }}
      </label>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-2">
      <TextButtonDropdown
        :label="selectedSortLabel"
        :items="issueSortOptions"
        :show-sort-icon="true"
        @clicked-item="emit('update:sort', $event)"
      />
      <TextButtonDropdown
        :label="issueScopeLabel"
        :items="issueScopeOptions"
        @clicked-item="
          emit(
            'update:showOnlyServerRuleViolations',
            $event === 'serverRuleViolations'
          )
        "
      />
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
              @toggle-selection="emit('toggle-selected-channel', $event)"
            />
          </div>
        </template>
      </FilterChip>
    </div>
  </div>
</template>
