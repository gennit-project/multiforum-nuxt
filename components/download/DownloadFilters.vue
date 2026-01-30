<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'nuxt/app';
import type { FilterGroup } from '@/__generated__/graphql';
import CheckBox from '@/components/CheckBox.vue';
import MultiSelect from '@/components/MultiSelect.vue';
import type { MultiSelectOption } from '@/components/MultiSelect.vue';
import { updateFilters } from '@/utils/routerUtils';

const props = defineProps({
  filterGroups: {
    type: Array as () => FilterGroup[],
    required: true,
  },
  isSidebar: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const router = useRouter();

// Parse filter values from URL query params
const getSelectedFiltersFromQuery = () => {
  const selected: Record<string, string[]> = {};

  props.filterGroups.forEach((group) => {
    const queryValue = route.query[`filter_${group.key}`];
    if (typeof queryValue === 'string') {
      selected[group.key] = queryValue.split(',');
    } else if (Array.isArray(queryValue)) {
      selected[group.key] = queryValue.filter(
        (v): v is string => typeof v === 'string'
      );
    } else {
      selected[group.key] = [];
    }
  });

  return selected;
};

const selectedFilters = ref(getSelectedFiltersFromQuery());

// Watch for route changes to update selected filters
watch(
  () => route.query,
  () => {
    selectedFilters.value = getSelectedFiltersFromQuery();
  }
);

const toggleFilter = (groupKey: string, optionValue: string) => {
  if (!selectedFilters.value[groupKey]) {
    selectedFilters.value[groupKey] = [];
  }

  const index = selectedFilters.value[groupKey].indexOf(optionValue);
  if (index === -1) {
    selectedFilters.value[groupKey].push(optionValue);
  } else {
    selectedFilters.value[groupKey].splice(index, 1);
  }

  // Update URL with new filter values
  const filterParams: Record<string, any> = {};

  // Add all filter groups to params, explicitly setting undefined for empty ones
  props.filterGroups.forEach((group) => {
    const values = selectedFilters.value[group.key] || [];
    if (values.length > 0) {
      filterParams[`filter_${group.key}`] = values.join(',');
    } else {
      // Explicitly set to undefined to remove the parameter
      filterParams[`filter_${group.key}`] = undefined;
    }
  });

  updateFilters({
    router,
    route,
    params: filterParams,
  });
};

const clearAllFilters = () => {
  // Clear local state
  selectedFilters.value = {};

  // Clear URL params
  const filterParams: Record<string, any> = {};
  props.filterGroups.forEach((group) => {
    filterParams[`filter_${group.key}`] = undefined;
  });

  updateFilters({
    router,
    route,
    params: filterParams,
  });
};

const hasActiveFilters = computed(() => {
  return Object.values(selectedFilters.value).some(
    (values) => values.length > 0
  );
});

const getActiveFilterCount = computed(() => {
  return Object.values(selectedFilters.value).reduce(
    (total, values) => total + values.length,
    0
  );
});

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

// Handle MultiSelect updates
const handleMultiSelectUpdate = (
  groupKey: string,
  selectedValues: string[]
) => {
  selectedFilters.value[groupKey] = selectedValues;

  // Update URL with new filter values
  const filterParams: Record<string, any> = {};

  // Add all filter groups to params, explicitly setting undefined for empty ones
  props.filterGroups.forEach((group) => {
    const values = selectedFilters.value[group.key] || [];
    if (values.length > 0) {
      filterParams[`filter_${group.key}`] = values.join(',');
    } else {
      // Explicitly set to undefined to remove the parameter
      filterParams[`filter_${group.key}`] = undefined;
    }
  });

  updateFilters({
    router,
    route,
    params: filterParams,
  });
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
        @click="clearAllFilters"
      >
        Clear all ({{ getActiveFilterCount }})
      </button>
    </div>

    <!-- Filter Groups -->
    <div class="space-y-6">
      <div v-for="group in filterGroups" :key="group.id" class="space-y-3">
        <h4 class="text-md font-medium text-gray-800 dark:text-gray-200">
          {{ group.displayName }}
        </h4>

        <!-- MultiSelect for groups with 10+ options -->
        <div v-if="shouldUseDropdown(group)">
          <MultiSelect
            :model-value="selectedFilters[group.key] || []"
            :options="getMultiSelectOptions(group)"
            placeholder="All"
            :show-chips="false"
            searchable
            search-placeholder="Search options..."
            @update:model-value="handleMultiSelectUpdate(group.key, $event)"
          />
        </div>

        <!-- Regular checkboxes for groups with <10 options -->
        <div v-else class="space-y-2">
          <div
            v-for="option in group.options"
            :key="option.id"
          >
            <CheckBox
              :checked="
                selectedFilters[group.key]?.includes(option.value) || false
              "
              :label="option.displayName"
              @update="toggleFilter(group.key, option.value)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="filterGroups.length === 0"
      class="py-6 text-center text-gray-500 dark:text-gray-400"
    >
      <p class="text-sm">No filters configured for this forum.</p>
    </div>
  </div>
</template>
