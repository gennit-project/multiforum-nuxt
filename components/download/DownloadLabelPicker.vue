<script setup lang="ts">
import { computed, watch } from 'vue';
import type { PropType } from 'vue';
import { FilterSelection } from '@/__generated__/graphql';
import type { GetChannelQuery } from '@/__generated__/operations';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import CheckBox from '@/components/CheckBox.vue';
type FilterGroup = GetChannelQuery['channels'][number]['FilterGroups'][number];

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

const normalizedSelectedLabels = computed(() => {
  const singleGroupKeys = new Set(
    props.filterGroups
      .filter((group) => group.uploadSelection === FilterSelection.Single)
      .map((group) => group.key)
  );

  return Object.fromEntries(
    Object.entries(props.selectedLabels).map(([groupKey, values]) => [
      groupKey,
      singleGroupKeys.has(groupKey) ? values.slice(0, 1) : values,
    ])
  );
});

const visibleSelectedLabels = computed<Array<[string, string[]]>>(() =>
  Object.entries(normalizedSelectedLabels.value).filter(
    ([groupKey]) => groupKey !== 'license'
  )
);

watch(
  normalizedSelectedLabels,
  (normalizedLabels) => {
    const hasInvalidSingleSelection = props.filterGroups.some(
      (group) =>
        group.uploadSelection === FilterSelection.Single &&
        (props.selectedLabels[group.key]?.length || 0) > 1
    );

    if (hasInvalidSingleSelection) {
      emit('update:selectedLabels', normalizedLabels);
    }
  },
  { immediate: true }
);

// Helper function to determine if a group should use dropdown
const shouldUseDropdown = (group: FilterGroup) => {
  return (group.options?.length || 0) >= 10;
};

const isSingleSelection = (group: FilterGroup) =>
  group.uploadSelection === FilterSelection.Single;

const getSingleSelection = (groupKey: string) =>
  normalizedSelectedLabels.value[groupKey]?.[0] || '';

// Convert filter group options to MultiSelect options
const getMultiSelectOptions = (group: FilterGroup): MultiSelectOption[] => {
  return (group.options || []).map((option) => ({
    value: option.value,
    label: option.displayName,
  }));
};

// Handle checkbox toggle for small groups
const toggleLabel = (groupKey: string, optionValue: string) => {
  const currentSelection = normalizedSelectedLabels.value[groupKey] || [];
  const index = currentSelection.indexOf(optionValue);

  let newSelection: string[];
  if (index === -1) {
    newSelection = [...currentSelection, optionValue];
  } else {
    newSelection = currentSelection.filter((val) => val !== optionValue);
  }

  const updatedLabels = {
    ...normalizedSelectedLabels.value,
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
    ...normalizedSelectedLabels.value,
    [groupKey]: selectedValues,
  };

  // Remove empty arrays to keep the object clean
  if (selectedValues.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedLabels[groupKey];
  }

  emit('update:selectedLabels', updatedLabels);
};

type SingleSelectionUpdate = {
  groupKey: string;
  optionValue: string;
};

const handleSingleSelectionUpdate = ({
  groupKey,
  optionValue,
}: SingleSelectionUpdate) => {
  const updatedLabels = { ...normalizedSelectedLabels.value };

  if (optionValue) {
    updatedLabels[groupKey] = [optionValue];
  } else {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete updatedLabels[groupKey];
  }

  emit('update:selectedLabels', updatedLabels);
};

const handleSingleSelectChange = ({
  groupKey,
  event,
}: {
  groupKey: string;
  event: Event;
}) => {
  handleSingleSelectionUpdate({
    groupKey,
    optionValue: (event.target as HTMLSelectElement).value,
  });
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

        <!-- Single-select dropdown for single-choice groups with 10+ options -->
        <div v-if="isSingleSelection(group) && shouldUseDropdown(group)">
          <select
            :id="`download-label-${group.id}`"
            :value="getSingleSelection(group.key)"
            :aria-label="`Select one ${group.displayName} label`"
            class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            @change="
              handleSingleSelectChange({ groupKey: group.key, event: $event })
            "
          >
            <option value="">None</option>
            <option
              v-for="option in group.options"
              :key="option.id"
              :value="option.value"
            >
              {{ option.displayName }}
            </option>
          </select>
        </div>

        <!-- Radio buttons for single-choice groups with fewer than 10 options -->
        <div v-else-if="isSingleSelection(group)" class="space-y-2">
          <div
            v-for="option in [
              { id: 'none', value: '', displayName: 'None' },
              ...(group.options || []),
            ]"
            :key="option.id"
            class="flex min-h-6 items-center"
          >
            <input
              :id="`download-label-${group.id}-${option.id}`"
              :name="`download-label-${group.id}`"
              type="radio"
              :value="option.value"
              :checked="getSingleSelection(group.key) === option.value"
              class="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              @change="
                handleSingleSelectionUpdate({
                  groupKey: group.key,
                  optionValue: option.value,
                })
              "
            />
            <label
              :for="`download-label-${group.id}-${option.id}`"
              class="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              {{ option.displayName }}
            </label>
          </div>
        </div>

        <!-- MultiSelect for multiple-choice groups with 10+ options -->
        <div v-else-if="shouldUseDropdown(group)">
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

        <!-- Checkboxes for multiple-choice groups with fewer than 10 options -->
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
