<script setup lang="ts">
import { ref, computed } from "vue";
import type { FilterGroup } from "@/__generated__/graphql";
import { FilterMode } from "@/__generated__/graphql";
import FilterOptionManager from "./FilterOptionManager.vue";
import CheckBox from "@/components/CheckBox.vue";

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

const emit = defineEmits(["updateFilterGroups"]);

const newGroupForm = ref({
  key: "",
  displayName: "",
  mode: FilterMode.Include,
});

const showNewGroupForm = ref(false);

const filterModeOptions = [
  { value: FilterMode.Include, label: "Inclusion (show downloads with these labels)" },
  { value: FilterMode.Exclude, label: "Exclusion (hide downloads with these labels)" },
];

const addNewGroup = () => {
  if (!newGroupForm.value.key || !newGroupForm.value.displayName) {
    return;
  }

  const newGroup: FilterGroup = {
    id: `new-${Date.now()}`,
    key: newGroupForm.value.key,
    displayName: newGroupForm.value.displayName,
    mode: newGroupForm.value.mode,
    order: props.filterGroups.length,
    options: [],
    // Required fields for GraphQL type but not used in this context
    __typename: "FilterGroup" as const,
    channel: {} as any,
    channelAggregate: null,
    channelConnection: {} as any,
    optionsAggregate: null,
    optionsConnection: {} as any,
  };

  const updatedGroups = [...props.filterGroups, newGroup];
  emit("updateFilterGroups", updatedGroups);

  // Reset form
  newGroupForm.value = {
    key: "",
    displayName: "",
    mode: FilterMode.Include,
  };
  showNewGroupForm.value = false;
};

const removeGroup = (groupId: string) => {
  const updatedGroups = props.filterGroups.filter(group => group.id !== groupId);
  emit("updateFilterGroups", updatedGroups);
};

const updateGroup = (groupId: string, updates: Partial<FilterGroup>) => {
  const updatedGroups = props.filterGroups.map(group => 
    group.id === groupId ? { ...group, ...updates } : group
  );
  emit("updateFilterGroups", updatedGroups);
};

const moveGroup = (groupId: string, direction: "up" | "down") => {
  const groups = [...props.filterGroups];
  const index = groups.findIndex(group => group.id === groupId);
  
  if (index === -1) return;
  
  if (direction === "up" && index > 0) {
    [groups[index], groups[index - 1]] = [groups[index - 1], groups[index]];
  } else if (direction === "down" && index < groups.length - 1) {
    [groups[index], groups[index + 1]] = [groups[index + 1], groups[index]];
  }
  
  // Update order values
  const orderedGroups = groups.map((group, i) => ({ ...group, order: i }));
  emit("updateFilterGroups", orderedGroups);
};

const isValidKey = (key: string) => /^[a-zA-Z0-9_]+$/.test(key);

const isKeyUnique = (key: string, excludeId?: string) => {
  return !props.filterGroups.some(group => 
    group.key === key && group.id !== excludeId
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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Download Filters
      </h3>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Configure filter groups that will appear in the downloads sidebar. Users can filter downloads by selecting options within these groups.
      </p>
    </div>

    <!-- Add New Filter Group Section -->
    <div class="space-y-4" :class="{ 'opacity-50 pointer-events-none': disabled }">
      <div class="flex items-center justify-between">
        <h4 class="text-md font-medium text-gray-900 dark:text-white">
          Filter Groups
        </h4>
        <button
          v-if="!showNewGroupForm"
          type="button"
          class="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="disabled"
          @click="showNewGroupForm = true"
        >
          Add New Filter Group
        </button>
      </div>

      <!-- New Group Form -->
      <div
        v-if="showNewGroupForm"
        class="p-4 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
      >
        <h5 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
          Add New Filter Group
        </h5>
        
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Group Type
            </label>
            <select
              v-model="newGroupForm.mode"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Computer-Friendly Key
            </label>
            <input
              v-model="newGroupForm.key"
              type="text"
              placeholder="e.g. lot_size"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              :class="{
                'border-red-500': newGroupForm.key && (!isValidKey(newGroupForm.key) || !isKeyUnique(newGroupForm.key))
              }"
            />
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
              v-if="newGroupForm.key && isValidKey(newGroupForm.key) && !isKeyUnique(newGroupForm.key)"
              class="mt-1 text-xs text-red-500"
            >
              This key is already used by another filter group.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name
            </label>
            <input
              v-model="newGroupForm.displayName"
              type="text"
              placeholder="e.g. Lot Size"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Human-readable name shown to users.
            </p>
          </div>

          <div class="flex space-x-3">
            <button
              type="button"
              class="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!canAddGroup"
              @click="addNewGroup"
            >
              Add Group
            </button>
            <button
              type="button"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-700"
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
        class="border border-gray-300 rounded-md p-4 bg-white dark:bg-gray-800 dark:border-gray-600"
        :class="{ 'opacity-50 pointer-events-none': disabled }"
      >
        <FilterOptionManager
          :filter-group="group"
          :group-index="index + 1"
          :can-move-up="index > 0"
          :can-move-down="index < filterGroups.length - 1"
          :disabled="disabled"
          :existing-keys="filterGroups.map(g => g.key).filter(k => k !== group.key)"
          @update-group="updateGroup"
          @remove-group="removeGroup"
          @move-group="moveGroup"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filterGroups.length === 0 && !showNewGroupForm"
      class="text-center py-6 text-gray-500 dark:text-gray-400"
      :class="{ 'opacity-50': disabled }"
    >
      <p>No filter groups configured.</p>
      <p class="text-sm">Add a filter group above to get started.</p>
    </div>

    <div v-if="disabled" class="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <strong>Note:</strong> Filter configuration is disabled because downloads are not enabled for this forum.
      </p>
    </div>
  </div>
</template>