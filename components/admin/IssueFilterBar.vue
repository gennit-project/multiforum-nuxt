<script lang="ts" setup>
import SearchBar from '@/components/SearchBar.vue';
import FilterChip from '@/components/FilterChip.vue';
import ChannelIcon from '@/components/icons/ChannelIcon.vue';
import SearchableForumList from '@/components/channel/SearchableForumList.vue';

defineProps<{
  searchInput: string;
  selectedChannels: string[];
  channelLabel: string;
  startDate: string;
  endDate: string;
  showOnlyServerRuleViolations: boolean;
}>();

const emit = defineEmits<{
  'update-search-input': [value: string];
  'update:startDate': [value: string];
  'update:endDate': [value: string];
  'toggle-selected-channel': [channel: string];
  'update:showOnlyServerRuleViolations': [value: boolean];
}>();
</script>

<template>
  <div class="flex flex-col gap-3 px-4 pb-4">
    <SearchBar
      :initial-value="searchInput"
      :search-placeholder="'Search issues'"
      :test-id="'server-issue-search-input'"
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
              @toggle-selection="emit('toggle-selected-channel', $event)"
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
        @change="
          emit(
            'update:showOnlyServerRuleViolations',
            ($event.target as HTMLInputElement).checked
          )
        "
      >
      <label for="show-only-server-rule-violations" class="mr-2"
        >Show only server rule violations</label
      >
    </div>
  </div>
</template>
