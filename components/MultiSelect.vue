<script setup lang="ts">
import { ref, computed, watch, nextTick, useId } from 'vue';
import type { PropType } from 'vue';
import CheckIcon from '@/components/icons/CheckIcon.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import XmarkIcon from '@/components/icons/XmarkIcon.vue';

// Type for option values
export type MultiSelectValue = string;

export interface MultiSelectOption {
  value: MultiSelectValue;
  label: string;
  icon?: string;
  avatar?: string;
  disabled?: boolean;
  description?: string;
  channels?: string[]; // For collection options: list of channel uniqueNames
}

export interface MultiSelectSection {
  title: string;
  options: MultiSelectOption[];
  emptyMessage?: string;
  selectAllLabel?: string; // If provided, shows a "select all" option
  isCollectionSection?: boolean; // If true, renders as collection list with inline channel names
}

const props = defineProps({
  // Selected values
  modelValue: {
    type: Array as PropType<MultiSelectValue[]>,
    default: () => [],
  },
  // Available options (legacy, for backwards compatibility)
  options: {
    type: Array as PropType<MultiSelectOption[]>,
    default: () => [],
  },
  // Sections (new approach with favorite channels, etc.)
  sections: {
    type: Array as PropType<MultiSelectSection[]>,
    default: () => [],
  },
  // Placeholder text when nothing selected
  placeholder: {
    type: String,
    default: 'Select items...',
  },
  // Description text above the component
  description: {
    type: String,
    default: '',
  },
  // Test ID for testing
  testId: {
    type: String,
    default: '',
  },
  // Whether to show a search bar
  searchable: {
    type: Boolean,
    default: false,
  },
  // Search placeholder
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
  // Custom height for the container
  height: {
    type: String,
    default: 'h-12',
  },
  // Whether to show chips for selected items
  showChips: {
    type: Boolean,
    default: true,
  },
  // Maximum height for the dropdown
  dropdownMaxHeight: {
    type: String,
    default: 'max-h-64',
  },
  // Loading state
  loading: {
    type: Boolean,
    default: false,
  },
  // Error message
  error: {
    type: String,
    default: '',
  },
  // Whether multiple selection is allowed
  multiple: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: MultiSelectValue[]];
  search: [query: string];
}>();

const isDropdownOpen = ref(false);
const searchQuery = ref('');
const selected = ref<MultiSelectValue[]>([...props.modelValue]);
const searchInputRef = ref<HTMLInputElement | null>(null);
const toggleButtonRef = ref<HTMLButtonElement | null>(null);
const popupRef = ref<HTMLElement | null>(null);
const popupId = useId();
const descriptionId = useId();
const errorId = useId();
const expandedSections = ref<Set<number>>(new Set());
const expandedCollections = ref<Set<string>>(new Set());

const toggleDropdown = () => {
  if (isDropdownOpen.value) {
    closeDropdown();
    return;
  }

  isDropdownOpen.value = true;

  nextTick(() => {
    if (props.searchable) {
      searchInputRef.value?.focus();
    } else {
      focusSelectionControl('first');
    }
  });
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
  // Clear search when closing dropdown to reset filter
  searchQuery.value = '';
};

const selectionControls = () =>
  Array.from(
    popupRef.value?.querySelectorAll<HTMLButtonElement>(
      '[data-selection-control]:not(:disabled)'
    ) || []
  );

const focusSelectionControl = (position: 'first' | 'last') => {
  const controls = selectionControls();
  controls[position === 'first' ? 0 : controls.length - 1]?.focus();
};

const openDropdown = (position: 'first' | 'last' = 'first') => {
  if (isDropdownOpen.value) return;
  isDropdownOpen.value = true;
  nextTick(() => {
    if (props.searchable && position === 'first') {
      searchInputRef.value?.focus();
    } else {
      focusSelectionControl(position);
    }
  });
};

// Close the dropdown and return focus to the toggle button (keyboard dismiss).
const closeAndReturnFocus = () => {
  closeDropdown();
  nextTick(() => toggleButtonRef.value?.focus());
};

const onSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeAndReturnFocus();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusSelectionControl('first');
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusSelectionControl('last');
  }
};

const onPopupKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeAndReturnFocus();
    return;
  }

  const target = event.target as HTMLElement;
  if (!target.matches('[data-selection-control]')) return;

  const controls = selectionControls();
  const currentIndex = controls.indexOf(target as HTMLButtonElement);
  let nextIndex: number | undefined;

  if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % controls.length;
  if (event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + controls.length) % controls.length;
  }
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = controls.length - 1;

  if (nextIndex !== undefined) {
    event.preventDefault();
    controls[nextIndex]?.focus();
  }
};

const toggleSelection = (value: MultiSelectValue) => {
  if (!props.multiple) {
    selected.value = selected.value.includes(value) ? [] : [value];
    closeDropdown();
    nextTick(() => toggleButtonRef.value?.focus());
  } else {
    const index = selected.value.indexOf(value);
    if (index === -1) {
      selected.value.push(value);
    } else {
      selected.value.splice(index, 1);
    }
  }
  emit('update:modelValue', selected.value);
};

const selectableOptions = (options: MultiSelectOption[]) =>
  options.filter((option) => !option.disabled);

const toggleSelectAll = (sectionOptions: MultiSelectOption[]) => {
  const sectionValues = selectableOptions(sectionOptions).map((opt) => opt.value);
  const allSelected = sectionValues.every((val) =>
    selected.value.includes(val)
  );

  if (allSelected) {
    // Deselect all items from this section
    selected.value = selected.value.filter(
      (val) => !sectionValues.includes(val)
    );
  } else {
    // Select all items from this section (deduplicate)
    const newSelections = [...new Set([...selected.value, ...sectionValues])];
    selected.value = newSelections;
  }
  emit('update:modelValue', selected.value);
};

const isSectionFullySelected = (sectionOptions: MultiSelectOption[]) => {
  const sectionValues = selectableOptions(sectionOptions).map((opt) => opt.value);
  return (
    sectionValues.length > 0 &&
    sectionValues.every((val) => selected.value.includes(val))
  );
};

// For collection sections: toggle all channels in a collection
const toggleCollectionChannels = (channels: string[]) => {
  const allSelected = channels.every((ch) => selected.value.includes(ch));

  if (allSelected) {
    // Deselect all channels from this collection
    selected.value = selected.value.filter((val) => !channels.includes(val));
  } else {
    // Select all channels from this collection (deduplicate)
    const newSelections = [...new Set([...selected.value, ...channels])];
    selected.value = newSelections;
  }
  emit('update:modelValue', selected.value);
};

const isCollectionFullySelected = (channels: string[]) => {
  return (
    channels.length > 0 && channels.every((ch) => selected.value.includes(ch))
  );
};

const toggleCollectionExpansion = (collectionId: string) => {
  if (expandedCollections.value.has(collectionId)) {
    expandedCollections.value.delete(collectionId);
  } else {
    expandedCollections.value.add(collectionId);
  }
  // Force reactivity update
  expandedCollections.value = new Set(expandedCollections.value);
};

const toggleSectionExpansion = (sectionIndex: number) => {
  if (expandedSections.value.has(sectionIndex)) {
    expandedSections.value.delete(sectionIndex);
  } else {
    expandedSections.value.add(sectionIndex);
  }
  // Force reactivity update
  expandedSections.value = new Set(expandedSections.value);
};

const removeSelection = (value: MultiSelectValue, event?: Event) => {
  if (event) {
    event.stopPropagation();
  }
  selected.value = selected.value.filter((item) => item !== value);
  emit('update:modelValue', selected.value);
};

const clearSelection = () => {
  selected.value = [];
  emit('update:modelValue', selected.value);
};

const updateSearch = (query: string) => {
  // ONLY update search query for filtering - do NOT affect selection
  searchQuery.value = query;
  emit('search', query);
};

const optionAriaLabel = (option: MultiSelectOption) => {
  return option.label === option.value
    ? option.label
    : `${option.label} (${option.value})`;
};

// Combine all options from both legacy options and sections
const allOptions = computed(() => {
  const optionsFromSections = props.sections.flatMap(
    (section) => section.options
  );
  return [...props.options, ...optionsFromSections];
});

// Filtered sections based on search
const filteredSections = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.sections;
  }

  // When searching, filter options within each section
  // Keep sections even if they have no matching options (to show empty message)
  const searchTerm = searchQuery.value.toLowerCase();
  return props.sections.map((section) => ({
    ...section,
    options: section.options.filter((option) => {
      const optionText =
        option.value === null || option.value === undefined
          ? option.label
          : String(option.value);
      return optionText.toLowerCase().includes(searchTerm);
    }),
  }));
});

// Filtered options based on search (for legacy options prop)
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options;
  }

  const searchTerm = searchQuery.value.toLowerCase();
  return props.options.filter((option) => {
    const optionText =
      option.value === null || option.value === undefined
        ? option.label
        : String(option.value);
    return optionText.toLowerCase().includes(searchTerm);
  });
});

// Get option by value
const getOptionByValue = (value: MultiSelectValue): MultiSelectOption | undefined => {
  return allOptions.value.find((option) => option.value === value);
};

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newVal) => {
    selected.value = [...newVal];
  },
  { deep: true }
);

// Selected options for display
const selectedOptions = computed(() => {
  return selected.value
    .map((value) => getOptionByValue(value))
    .filter(Boolean) as MultiSelectOption[];
});

const toggleAriaLabel = computed(() => {
  const valueSummary = selectedOptions.value.length
    ? selectedOptions.value.map((option) => option.label).join(', ')
    : 'No selection';
  return `${props.placeholder} Current selection: ${valueSummary}. ${
    isDropdownOpen.value ? 'Hide options' : 'Show options'
  }`;
});

const describedBy = computed(() => {
  return [props.description && descriptionId, props.error && errorId]
    .filter(Boolean)
    .join(' ') || undefined;
});
</script>

<template>
  <div>
    <div
      v-if="description"
      :id="descriptionId"
      class="py-1 text-sm dark:text-gray-300"
    >
      {{ description }}
    </div>

    <div
      v-if="error"
      :id="errorId"
      role="alert"
      class="mb-2 text-sm text-red-500"
    >
      {{ error }}
    </div>

    <div v-click-outside="closeDropdown" class="relative">
      <div
        :class="[
          'flex w-full rounded-lg border px-4 text-left dark:border-gray-700 dark:bg-gray-700',
          showChips
            ? 'min-h-10 flex-wrap items-center'
            : 'min-h-12 items-start py-2',
        ]"
      >
        <!-- Selected items as chips -->
        <div
          v-if="showChips && selectedOptions.length > 0"
          class="flex flex-wrap gap-1"
        >
          <div
            v-for="option in selectedOptions"
            :key="String(option.value)"
            class="mr-2 mt-1 inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-sm text-orange-700 dark:bg-orange-700 dark:text-orange-100"
          >
            <span class="font-mono">{{ option.value }}</span>
            <button
              type="button"
              :aria-label="`Remove ${option.value}`"
              class="ml-1 cursor-pointer rounded hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              @click="removeSelection(option.value, $event)"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        <!-- Single selection display or comma-separated values (when not showing chips) -->
        <div
          v-else-if="!showChips && selectedOptions.length > 0"
          class="flex flex-1 items-start"
        >
          <!-- Show avatar/icon only for single selection -->
          <img
            v-if="selectedOptions.length === 1 && selectedOptions[0]?.avatar"
            :src="selectedOptions[0]?.avatar"
            :alt="selectedOptions[0]?.label"
            class="mr-2 h-6 w-6 flex-shrink-0 rounded-full"
          >
          <i
            v-else-if="selectedOptions.length === 1 && selectedOptions[0]?.icon"
            :class="[selectedOptions[0]?.icon, 'mr-2 flex-shrink-0']"
          />

          <!-- Show comma-separated labels for multiple selections -->
          <span class="break-words text-gray-900 dark:text-white">
            {{ selectedOptions.map((option) => option.label).join(', ') }}
          </span>
        </div>

        <!-- Placeholder -->
        <div
          v-if="selectedOptions.length === 0"
          class="text-gray-500 dark:text-gray-400"
        >
          <span>{{ placeholder }}</span>
        </div>

        <!-- Clear button and dropdown arrow -->
        <div class="ml-auto flex items-center text-gray-400">
          <!-- Clear button -->
          <button
            v-if="selectedOptions.length > 0"
            type="button"
            aria-label="Clear selection"
            class="mr-2 transition-colors hover:text-red-500"
            :title="'Clear selection'"
            @click.stop="clearSelection"
          >
            <XmarkIcon class="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            ref="toggleButtonRef"
            type="button"
            :data-testid="testId"
            :aria-label="toggleAriaLabel"
            :aria-describedby="describedBy"
            :aria-expanded="isDropdownOpen"
            :aria-controls="popupId"
            class="flex min-h-10 min-w-10 items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            @click="toggleDropdown"
            @keydown.down.prevent="openDropdown('first')"
            @keydown.up.prevent="openDropdown('last')"
          >
            <ChevronDownIcon
              class="h-4 w-4 transition-transform"
              :class="isDropdownOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <!-- Dropdown -->
      <div
        v-if="isDropdownOpen"
        :id="popupId"
        ref="popupRef"
        role="region"
        :aria-label="`${placeholder} options`"
        :class="[
          'absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800',
          dropdownMaxHeight,
          'overflow-y-auto',
        ]"
        @keydown="onPopupKeydown"
      >
        <!-- Search bar for dropdown -->
        <div
          v-if="searchable"
          class="border-b border-gray-200 p-2 dark:border-gray-600"
        >
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            :aria-label="searchPlaceholder"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            @input="updateSearch(searchQuery)"
            @keydown="onSearchKeydown"
            @keyup.stop
            @click.stop
            @focus.stop
            @blur.stop
          >
        </div>

        <!-- Loading state -->
        <div
          v-if="loading"
          role="status"
          class="p-4 text-center text-gray-500 dark:text-gray-400"
        >
          Loading...
        </div>

        <!-- Sections view -->
        <div v-else-if="props.sections.length > 0">
          <div
            v-for="(section, sectionIndex) in filteredSections"
            :key="sectionIndex"
          >
            <div
              :id="`${popupId}-section-${sectionIndex}`"
              class="bg-gray-50 font-semibold px-4 py-2 text-xs uppercase text-gray-600 dark:bg-gray-900 dark:text-gray-400"
            >
              {{ section.title }}
            </div>

            <!-- Select All option (if section has selectAllLabel) -->
            <div v-if="section.selectAllLabel && section.options.length > 0">
              <button
                type="button"
                data-selection-control
                :aria-pressed="isSectionFullySelected(section.options)"
                :class="[
                  'flex w-full items-center border-b px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 dark:border-gray-600 dark:hover:bg-gray-700',
                  isSectionFullySelected(section.options)
                    ? 'bg-orange-50 dark:bg-orange-900/20'
                    : '',
                ]"
                @click="toggleSelectAll(section.options)"
              >
                <!-- Checkbox for select all -->
                <div class="relative mr-3">
                  <span
                    aria-hidden="true"
                    :class="[
                      'flex h-4 w-4 items-center justify-center rounded border',
                      isSectionFullySelected(section.options)
                        ? 'border-orange-600 bg-orange-600 text-white'
                        : 'border-gray-400 dark:border-gray-500',
                    ]"
                  >
                    <CheckIcon
                      v-if="isSectionFullySelected(section.options)"
                      class="h-3 w-3"
                    />
                  </span>
                </div>

                <!-- Label -->
                <span
                  class="flex-1 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ section.selectAllLabel }}
                </span>

                <!-- Count badge -->
                <span
                  class="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                >
                  {{ selectableOptions(section.options).length }}
                </span>
              </button>

              <!-- Preview list of forums -->
              <div class="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                <span v-if="section.options.length <= 3">
                  {{ section.options.map((opt) => opt.value).join(', ') }}
                </span>
                <span v-else-if="!expandedSections.has(sectionIndex)">
                  {{
                    section.options
                      .slice(0, 3)
                      .map((opt) => opt.value)
                      .join(', ')
                  }}
                  <button
                    type="button"
                    class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    @click.stop="toggleSectionExpansion(sectionIndex)"
                  >
                    (show all)
                  </button>
                </span>
                <span v-else>
                  {{ section.options.map((opt) => opt.value).join(', ') }}
                  <button
                    type="button"
                    class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                    @click.stop="toggleSectionExpansion(sectionIndex)"
                  >
                    (show less)
                  </button>
                </span>
              </div>
            </div>

            <!-- Collection section (renders each collection as a row with inline channel list) -->
            <div
              v-if="section.isCollectionSection && section.options.length > 0"
            >
              <div
                v-for="collectionOption in section.options"
                :key="String(collectionOption.value)"
                class="border-b dark:border-gray-600"
              >
                <button
                  type="button"
                  data-selection-control
                  :aria-pressed="
                    isCollectionFullySelected(
                      collectionOption.channels || []
                    )
                  "
                  :aria-label="`Select all forums in ${collectionOption.label}`"
                  :class="[
                    'flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 dark:hover:bg-gray-700',
                    isCollectionFullySelected(
                      collectionOption.channels || []
                    )
                      ? 'bg-orange-50 dark:bg-orange-900/20'
                      : '',
                  ]"
                  @click="
                    toggleCollectionChannels(
                      collectionOption.channels || []
                    )
                  "
                >
                  <div class="relative mr-3">
                    <span
                      aria-hidden="true"
                      :class="[
                        'flex h-4 w-4 items-center justify-center rounded border',
                        isCollectionFullySelected(collectionOption.channels || [])
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-gray-400 dark:border-gray-500',
                      ]"
                    >
                      <CheckIcon
                        v-if="
                        isCollectionFullySelected(
                          collectionOption.channels || []
                        )
                      "
                        class="h-3 w-3"
                      />
                    </span>
                  </div>

                  <div class="flex-1 text-sm">
                    <span class="font-medium text-gray-900 dark:text-white">{{
                      collectionOption.label
                    }}</span>
                  </div>

                  <span
                    class="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                  >
                    {{ (collectionOption.channels || []).length }}
                  </span>
                </button>

                <div class="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">
                  <span class="sr-only">
                    Forums in {{ collectionOption.label }}:
                  </span>
                  <span
                    v-if="(collectionOption.channels || []).length <= 3"
                  >
                    {{ (collectionOption.channels || []).join(', ') }}
                  </span>
                  <span
                    v-else-if="
                      !expandedCollections.has(String(collectionOption.value))
                    "
                  >
                    {{
                      (collectionOption.channels || [])
                        .slice(0, 3)
                        .join(', ')
                    }}
                    <button
                      type="button"
                      class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      @click.stop="
                        toggleCollectionExpansion(
                          String(collectionOption.value)
                        )
                      "
                    >
                      show more
                    </button>
                  </span>
                  <span v-else>
                    {{ (collectionOption.channels || []).join(', ') }}
                    <button
                      type="button"
                      class="ml-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      @click.stop="
                        toggleCollectionExpansion(
                          String(collectionOption.value)
                        )
                      "
                    >
                      show less
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <!-- Section options (regular items, not for collections or selectAll sections) -->
            <ul
              v-if="
                section.options.length > 0 &&
                !section.selectAllLabel &&
                !section.isCollectionSection
              "
              :aria-labelledby="`${popupId}-section-${sectionIndex}`"
              class="py-1"
            >
              <li
                v-for="option in section.options"
                :key="String(option.value)"
              >
                <button
                  type="button"
                  data-selection-control
                  :aria-pressed="selected.includes(option.value)"
                  :disabled="option.disabled"
                  :aria-label="optionAriaLabel(option)"
                  :class="[
                    'flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 dark:hover:bg-gray-700',
                    selected.includes(option.value)
                      ? 'bg-orange-50 dark:bg-orange-900/20'
                      : '',
                    option.disabled ? 'cursor-not-allowed opacity-50' : '',
                  ]"
                  @click="toggleSelection(option.value)"
                >
                  <div v-if="multiple" class="relative mr-3">
                    <span
                      aria-hidden="true"
                      :class="[
                        'flex h-4 w-4 items-center justify-center rounded border',
                        selected.includes(option.value)
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-gray-400 dark:border-gray-500',
                      ]"
                    >
                      <CheckIcon
                        v-if="selected.includes(option.value)"
                        class="h-3 w-3"
                      />
                    </span>
                  </div>

                  <div class="flex-1 text-sm">
                    <div>
                      <span class="font-mono text-gray-900 dark:text-white">
                        {{ option.value }}
                      </span>
                      <span
                        v-if="option.label && option.label !== option.value"
                        class="text-gray-500 dark:text-gray-400"
                      >
                        ({{ option.label }})
                      </span>
                    </div>
                    <div
                      v-if="option.description"
                      class="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {{ option.description }}
                    </div>
                  </div>

                  <CheckIcon
                    v-if="!multiple && selected.includes(option.value)"
                    class="h-4 w-4 text-orange-600"
                    aria-hidden="true"
                  />
                </button>
              </li>
            </ul>

            <!-- Empty section message (only shown when section has no options and no selectAllLabel) -->
            <div
              v-if="
                section.options.length === 0 &&
                !section.selectAllLabel &&
                !section.isCollectionSection
              "
              class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
            >
              {{ section.emptyMessage || 'No items' }}
            </div>
          </div>
        </div>

        <!-- Legacy options view (for backwards compatibility) -->
        <ul
          v-else-if="filteredOptions.length > 0"
          class="py-1"
        >
          <li
            v-for="option in filteredOptions"
            :key="String(option.value)"
          >
            <button
              type="button"
              data-selection-control
              :aria-pressed="selected.includes(option.value)"
              :disabled="option.disabled"
              :aria-label="optionAriaLabel(option)"
              :class="[
                'flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 dark:hover:bg-gray-700',
                selected.includes(option.value)
                  ? 'bg-orange-50 dark:bg-orange-900/20'
                  : '',
                option.disabled ? 'cursor-not-allowed opacity-50' : '',
              ]"
              @click="toggleSelection(option.value)"
            >
              <div v-if="multiple" class="relative mr-3">
                <span
                  aria-hidden="true"
                  :class="[
                    'flex h-4 w-4 items-center justify-center rounded border',
                    selected.includes(option.value)
                      ? 'border-orange-600 bg-orange-600 text-white'
                      : 'border-gray-400 dark:border-gray-500',
                  ]"
                >
                  <CheckIcon
                    v-if="selected.includes(option.value)"
                    class="h-3 w-3"
                  />
                </span>
              </div>

              <img
                v-if="option.avatar"
                :src="option.avatar"
                alt=""
                class="mr-3 h-6 w-6 rounded-full"
              >

              <i
                v-else-if="option.icon"
                :class="[option.icon, 'mr-3']"
                aria-hidden="true"
              />

              <div class="flex-1 text-sm">
                <div class="text-gray-900 dark:text-white">
                  {{ option.label }}
                </div>
                <div
                  v-if="option.description"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ option.description }}
                </div>
              </div>

              <CheckIcon
                v-if="!multiple && selected.includes(option.value)"
                class="h-4 w-4 text-orange-600"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>

        <!-- No options -->
        <div
          v-else
          role="status"
          class="p-4 text-center text-gray-500 dark:text-gray-400"
        >
          No options available
        </div>
      </div>
    </div>
  </div>
</template>
