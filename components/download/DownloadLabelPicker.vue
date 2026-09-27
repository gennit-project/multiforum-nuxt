<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { FilterGroup } from '@/__generated__/graphql';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import CheckBox from '@/components/CheckBox.vue';

const props = defineProps({
  filterGroups: {
    type: Array as PropType<FilterGroup[]>,
    required: true,
  },
  selectedLabels: {
    type: Object as PropType<Record<string, string[]>>,
    default: () => ({}),
  },
});

const emit = defineEmits<{
  'update:selectedLabels': [labels: Record<string, string[]>];
}>();

const visibleFilterGroups = computed(() =>
  props.filterGroups.filter((group) => group.key !== 'license')
);

const visibleSelectedLabels = computed<Array<[string, string[]]>>(() =>
  Object.entries(props.selectedLabels).filter(
    ([groupKey]) => groupKey !== 'license'
  )
);

// Helper function to determine if a group should use dropdown
const shouldUseDropdown = (group: FilterGroup) => {
  return (group.options?.length || 0) >= 10;
};

// Convert filter group options to MultiSelect options
const getMultiSelectOptions = (group: FilterGroup): MultiSelectOption[] => {
  return (group.options || []).map((option) => ({
    value: option.value,
    label: option.displayName,
  }));
};

// Handle checkbox toggle for small groups
const toggleLabel = (groupKey: string, optionValue: string) => {
  const currentSelection = props.selectedLabels[groupKey] || [];
  const index = currentSelection.indexOf(optionValue);

  let newSelection: string[];
  if (index === -1) {
    newSelection = [...currentSelection, optionValue];
  } else {
    newSelection = currentSelection.filter((val) => val !== optionValue);
  }

  const updatedLabels = {
    ...props.selectedLabels,
    [groupKey]: newSelection,
  };

  // Remove empty arrays to keep the object clean
  if (newSelection.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedLabels[groupKey];
  }

  emit('update:selectedLabels', updatedLabels);
};

// Handle MultiSelect updates for large groups
const handleMultiSelectUpdate = (
  groupKey: string,
  selectedValues: string[]
) => {
  const updatedLabels = {
    ...props.selectedLabels,
    [groupKey]: selectedValues,
  };

  // Remove empty arrays to keep the object clean
  if (selectedValues.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedLabels[groupKey];
  }

  emit('update:selectedLabels', updatedLabels);
};

// Check if any labels are selected
const hasSelectedLabels = computed(() => {
  return visibleSelectedLabels.value.some(([, values]) => values.length > 0);
});

// Get total count of selected labels
const selectedLabelCount = computed(() => {
  return visibleSelectedLabels.value.reduce(
    (total, [, values]) => total + values.length,
    0
  );
});
</script>

<template>
  <div
    class="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-600"
  >
    <!-- Header: the section title comes from the parent form row -->
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Select labels to help users find your download through filters
      </p>
      <div
        v-if="hasSelectedLabels"
        class="shrink-0 text-sm text-gray-600 dark:text-gray-400"
      >
        {{ selectedLabelCount }} selected
      </div>
    </div>

    <!-- Filter Groups -->
    <div class="space-y-6">
      <fieldset
        v-for="group in visibleFilterGroups"
        :key="group.id"
        class="space-y-2"
      >
        <legend
          class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ group.displayName }}
        </legend>

        <!-- MultiSelect for groups with 10+ options -->
        <div v-if="shouldUseDropdown(group)">
          <MultiSelect
            :model-value="selectedLabels[group.key] || []"
            :options="getMultiSelectOptions(group)"
            placeholder="None selected"
            :show-chips="false"
            searchable
            search-placeholder="Search options..."
            @update:model-value="handleMultiSelectUpdate(group.key, $event)"
          />
        </div>

        <!-- Regular checkboxes for groups with <10 options -->
        <div v-else class="space-y-2">
          <div v-for="option in group.options" :key="option.id">
            <CheckBox
              :checked="
                selectedLabels[group.key]?.includes(option.value) || false
              "
              :label="option.displayName"
              @update="toggleLabel(group.key, option.value)"
            />
          </div>
        </div>
      </fieldset>
    </div>

    <!-- Empty state -->
    <div
      v-if="visibleFilterGroups.length === 0"
      class="py-6 text-center text-gray-500 dark:text-gray-400"
    >
      <p class="text-sm">No label categories configured for this forum.</p>
    </div>
  </div>
</template>
