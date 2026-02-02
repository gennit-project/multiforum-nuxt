<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { FilterGroup, Channel, FilterGroupChannelConnection, FilterGroupOptionsConnection, FilterOption, FilterOptionGroupConnection } from '@/__generated__/graphql';
import { FilterMode } from '@/__generated__/graphql';

// Stub types for required GraphQL fields that aren't used in this form context
const emptyChannel = {} as Channel;
const emptyChannelConnection = {} as FilterGroupChannelConnection;
const emptyOptionsConnection = {} as FilterGroupOptionsConnection;
const emptyGroupConnection = {} as FilterOptionGroupConnection;
const emptyFilterGroup = {} as FilterGroup;
import FilterOptionManager from './FilterOptionManager.vue';
import yaml from 'js-yaml';
// import CheckBox from "@/components/CheckBox.vue"; // Unused for now

const props = defineProps({
  filterGroups: {
    type: Array as () => FilterGroup[],
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updateFilterGroups']);

const newGroupForm = ref({
  key: '',
  displayName: '',
  mode: FilterMode.Include,
});

const showNewGroupForm = ref(false);
const viewMode = ref<'form' | 'yaml'>('form');
const yamlContent = ref('');
const yamlError = ref('');

const filterModeOptions = [
  {
    value: FilterMode.Include,
    label: 'Inclusion (show downloads with these labels)',
  },
  {
    value: FilterMode.Exclude,
    label: 'Exclusion (hide downloads with these labels)',
  },
];

// YAML conversion utilities
type YamlFilterGroup = {
  key: string;
  displayName: string;
  mode: 'INCLUDE' | 'EXCLUDE';
  order: number;
  options: {
    value: string;
    displayName: string;
    order: number;
  }[];
};

const convertFilterGroupsToYaml = (filterGroups: FilterGroup[]): string => {
  const cleanGroups: YamlFilterGroup[] = filterGroups.map((group) => ({
    key: group.key,
    displayName: group.displayName,
    mode: group.mode,
    order: group.order,
    options: (group.options || []).map((option) => ({
      value: option.value,
      displayName: option.displayName,
      order: option.order,
    })),
  }));

  try {
    return yaml.dump(cleanGroups, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  } catch (error) {
    console.error('Error converting to YAML:', error);
    return '';
  }
};

const convertYamlToFilterGroups = (
  yamlString: string
): { success: boolean; filterGroups?: FilterGroup[]; error?: string } => {
  try {
    const parsed = yaml.load(yamlString) as YamlFilterGroup[];

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        error: 'YAML must contain an array of filter groups',
      };
    }

    const filterGroups: FilterGroup[] = parsed.map((group, index) => {
      if (!group.key || !group.displayName) {
        throw new Error(
          `Group at index ${index} is missing required fields (key, displayName)`
        );
      }

      if (!['INCLUDE', 'EXCLUDE'].includes(group.mode)) {
        throw new Error(
          `Group "${group.key}" has invalid mode. Must be INCLUDE or EXCLUDE`
        );
      }

      return {
        id: '', // Empty ID for new/edited groups - server will handle
        key: group.key,
        displayName: group.displayName,
        mode: group.mode as FilterMode,
        order: group.order ?? index,
        options: (group.options || []).map((option, optionIndex) => ({
          id: '', // Empty ID for new/edited options - server will handle
          value: option.value,
          displayName: option.displayName,
          order: option.order ?? optionIndex,
          // Required GraphQL fields
          __typename: 'FilterOption' as const,
          group: emptyFilterGroup, // Will be populated by parent
          groupAggregate: null,
          groupConnection: emptyGroupConnection,
        })),
        // Required GraphQL fields
        __typename: 'FilterGroup' as const,
        channel: emptyChannel,
        channelAggregate: null,
        channelConnection: emptyChannelConnection,
        optionsAggregate: null,
        optionsConnection: emptyOptionsConnection,
      };
    });

    return { success: true, filterGroups };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid YAML format',
    };
  }
};

const addNewGroup = () => {
  if (!newGroupForm.value.key || !newGroupForm.value.displayName) {
    return;
  }

  const newGroup: FilterGroup = {
    id: '', // Empty ID for new groups - server will generate
    key: newGroupForm.value.key,
    displayName: newGroupForm.value.displayName,
    mode: newGroupForm.value.mode,
    order: props.filterGroups.length,
    options: [],
    // Required fields for GraphQL type but not used in this context
    __typename: 'FilterGroup' as const,
    channel: emptyChannel,
    channelAggregate: null,
    channelConnection: emptyChannelConnection,
    optionsAggregate: null,
    optionsConnection: emptyOptionsConnection,
  };

  const updatedGroups = [...props.filterGroups, newGroup];
  emit('updateFilterGroups', updatedGroups);

  // Reset form
  newGroupForm.value = {
    key: '',
    displayName: '',
    mode: FilterMode.Include,
  };
  showNewGroupForm.value = false;
};

const removeGroup = (groupId: string) => {
  console.log('Removing group with ID:', groupId);
  console.log(
    'Current groups:',
    props.filterGroups.map((g) => ({ id: g.id, key: g.key }))
  );

  const updatedGroups = props.filterGroups.filter(
    (group) => group.id !== groupId
  );

  console.log(
    'Updated groups after removal:',
    updatedGroups.map((g) => ({ id: g.id, key: g.key }))
  );
  emit('updateFilterGroups', updatedGroups);
};

const updateGroup = (groupId: string, updates: Partial<FilterGroup>) => {
  const updatedGroups = props.filterGroups.map((group) =>
    group.id === groupId ? { ...group, ...updates } : group
  );
  emit('updateFilterGroups', updatedGroups);
};

const moveGroup = (groupId: string, direction: 'up' | 'down') => {
  const groups = [...props.filterGroups];
  const index = groups.findIndex((group) => group.id === groupId);

  if (index === -1) return;

  if (direction === 'up' && index > 0) {
    const temp = groups[index];
    groups[index] = groups[index - 1]!;
    groups[index - 1] = temp!;
  } else if (direction === 'down' && index < groups.length - 1) {
    const temp = groups[index];
    groups[index] = groups[index + 1]!;
    groups[index + 1] = temp!;
  }

  // Update order values
  const orderedGroups = groups.map((group, i) => ({ ...group, order: i }));
  emit('updateFilterGroups', orderedGroups);
};

const isValidKey = (key: string) => /^[a-zA-Z0-9_]+$/.test(key);

const isKeyUnique = (key: string, excludeId?: string) => {
  return !props.filterGroups.some(
    (group) => group.key === key && group.id !== excludeId
  );
};

const canAddGroup = computed(() => {
  return (
    newGroupForm.value.key &&
    newGroupForm.value.displayName &&
    isValidKey(newGroupForm.value.key) &&
    isKeyUnique(newGroupForm.value.key)
  );
});

// YAML Editor Functions
const switchToYamlView = () => {
  yamlContent.value = convertFilterGroupsToYaml(props.filterGroups);
  yamlError.value = '';
  viewMode.value = 'yaml';
};

const switchToFormView = () => {
  viewMode.value = 'form';
};

const applyYamlChanges = () => {
  const result = convertYamlToFilterGroups(yamlContent.value);

  if (result.success && result.filterGroups) {
    yamlError.value = '';
    emit('updateFilterGroups', result.filterGroups);
    viewMode.value = 'form';
  } else {
    yamlError.value = result.error || 'Unknown error occurred';
  }
};

const cancelYamlChanges = () => {
  yamlContent.value = convertFilterGroupsToYaml(props.filterGroups);
  yamlError.value = '';
  viewMode.value = 'form';
};

// Watch for changes to filterGroups when in YAML mode to keep YAML in sync
watch(
  () => props.filterGroups,
  (newGroups) => {
    if (viewMode.value === 'yaml') {
      yamlContent.value = convertFilterGroupsToYaml(newGroups);
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            Download Filters
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure filter groups that will appear in the downloads sidebar.
            Users can filter downloads by selecting options within these groups.
          </p>
        </div>

        <!-- View Mode Toggle -->
        <div
          class="flex rounded-md shadow-sm"
          :class="{ 'pointer-events-none opacity-50': disabled }"
        >
          <button
            type="button"
            class="relative inline-flex items-center border px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="
              viewMode === 'form'
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'hover:bg-gray-50 border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            "
            :disabled="disabled"
            @click="switchToFormView"
          >
            Form Editor
          </button>
          <button
            type="button"
            class="relative -ml-px inline-flex items-center border px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="
              viewMode === 'yaml'
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'hover:bg-gray-50 border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            "
            :disabled="disabled"
            @click="switchToYamlView"
          >
            YAML Editor
          </button>
        </div>
      </div>
    </div>

    <!-- Form Editor View -->
    <div v-if="viewMode === 'form'" class="space-y-6">
      <!-- Add New Filter Group Section -->
      <div
        class="space-y-4"
        :class="{ 'pointer-events-none opacity-50': disabled }"
      >
        <div class="flex items-center justify-between">
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Filter Groups
          </h4>
          <button
            v-if="!showNewGroupForm"
            type="button"
            class="border-transparent rounded-md border bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="disabled"
            @click="showNewGroupForm = true"
          >
            Add New Filter Group
          </button>
        </div>

        <!-- New Group Form -->
        <div
          v-if="showNewGroupForm"
          class="bg-gray-50 rounded-md border border-gray-300 p-4 dark:border-gray-600 dark:bg-gray-800"
        >
          <h5 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            Add New Filter Group
          </h5>

          <div class="space-y-3">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Group Type
              </label>
              <select
                v-model="newGroupForm.mode"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option
                  v-for="option in filterModeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Computer-Friendly Key
              </label>
              <input
                v-model="newGroupForm.key"
                type="text"
                placeholder="e.g. lot_size"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                :class="{
                  'border-red-500':
                    newGroupForm.key &&
                    (!isValidKey(newGroupForm.key) ||
                      !isKeyUnique(newGroupForm.key)),
                }"
              >
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only letters, numbers, and underscores allowed. Must be unique.
              </p>
              <p
                v-if="newGroupForm.key && !isValidKey(newGroupForm.key)"
                class="mt-1 text-xs text-red-500"
              >
                Key can only contain letters, numbers, and underscores.
              </p>
              <p
                v-if="
                  newGroupForm.key &&
                  isValidKey(newGroupForm.key) &&
                  !isKeyUnique(newGroupForm.key)
                "
                class="mt-1 text-xs text-red-500"
              >
                This key is already used by another filter group.
              </p>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Display Name
              </label>
              <input
                v-model="newGroupForm.displayName"
                type="text"
                placeholder="e.g. Lot Size"
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Human-readable name shown to users.
              </p>
            </div>

            <div class="flex space-x-3">
              <button
                type="button"
                class="border-transparent rounded-md border bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canAddGroup"
                @click="addNewGroup"
              >
                Add Group
              </button>
              <button
                type="button"
                class="hover:bg-gray-50 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
                @click="showNewGroupForm = false"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Existing Filter Groups -->
      <div v-if="filterGroups.length > 0" class="space-y-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          Existing Filter Groups
        </h4>

        <div
          v-for="(group, index) in filterGroups"
          :key="group.id"
          class="rounded-md border border-gray-300 bg-white p-4 dark:border-gray-600 dark:bg-gray-800"
          :class="{ 'pointer-events-none opacity-50': disabled }"
        >
          <FilterOptionManager
            :filter-group="group"
            :group-index="index + 1"
            :can-move-up="index > 0"
            :can-move-down="index < filterGroups.length - 1"
            :disabled="disabled"
            :existing-keys="
              filterGroups.map((g) => g.key).filter((k) => k !== group.key)
            "
            @update-group="updateGroup"
            @remove-group="removeGroup"
            @move-group="moveGroup"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filterGroups.length === 0 && !showNewGroupForm"
        class="py-6 text-center text-gray-500 dark:text-gray-400"
        :class="{ 'opacity-50': disabled }"
      >
        <p>No filter groups configured.</p>
        <p class="text-sm">Add a filter group above to get started.</p>
      </div>

      <div v-if="disabled" class="bg-gray-50 rounded-md p-4 dark:bg-gray-800">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Filter configuration is disabled because
          downloads are not enabled for this forum.
        </p>
      </div>
    </div>

    <!-- YAML Editor View -->
    <div v-else-if="viewMode === 'yaml'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          YAML Editor
        </h4>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Edit filter groups as YAML for faster bulk configuration
        </div>
      </div>

      <!-- YAML Textarea -->
      <div class="space-y-3">
        <div>
          <label
            class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Filter Groups Configuration
          </label>
          <textarea
            v-model="yamlContent"
            class="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            :class="{ 'border-red-500': yamlError }"
            rows="20"
            placeholder="# Filter groups configuration
- key: example_category
  displayName: Example Category
  mode: INCLUDE
  order: 0
  options:
    - value: option1
      displayName: Option 1
      order: 0
    - value: option2
      displayName: Option 2
      order: 1"
            :disabled="disabled"
          />
        </div>

        <!-- Error Message -->
        <div v-if="yamlError" class="bg-red-50 rounded-md p-3 dark:bg-red-900">
          <div class="text-sm text-red-700 dark:text-red-200">
            <strong>YAML Error:</strong> {{ yamlError }}
          </div>
        </div>

        <!-- Help Text -->
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Required fields:</strong></p>
          <ul class="mt-1 list-inside list-disc space-y-1">
            <li>
              <code>key</code>: Unique identifier (letters, numbers, underscores
              only)
            </li>
            <li><code>displayName</code>: Human-readable name</li>
            <li><code>mode</code>: Either "INCLUDE" or "EXCLUDE"</li>
            <li><code>order</code>: Display order (number)</li>
            <li>
              <code>options</code>: Array of filter options with
              <code>value</code>, <code>displayName</code>, and
              <code>order</code>
            </li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-3">
          <button
            type="button"
            class="border-transparent rounded-md border bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="disabled || !yamlContent.trim()"
            @click="applyYamlChanges"
          >
            Apply Changes
          </button>
          <button
            type="button"
            class="hover:bg-gray-50 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
            @click="cancelYamlChanges"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
