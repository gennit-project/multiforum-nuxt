<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FilterGroup, FilterOption } from '@/__generated__/graphql';
import { FilterMode } from '@/__generated__/graphql';

const props = defineProps({
  filterGroup: {
    type: Object as () => FilterGroup,
    required: true,
  },
  groupIndex: {
    type: Number,
    required: true,
  },
  canMoveUp: {
    type: Boolean,
    default: false,
  },
  canMoveDown: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  existingKeys: {
    type: Array as () => string[],
    default: () => [],
  },
});

const emit = defineEmits(['updateGroup', 'removeGroup', 'moveGroup']);

const isEditing = ref(false);
const showNewOptionForm = ref(false);

const editForm = ref({
  key: props.filterGroup.key,
  displayName: props.filterGroup.displayName,
  mode: props.filterGroup.mode,
});

const newOptionForm = ref({
  value: '',
  displayName: '',
});

const filterModeOptions = [
  { value: FilterMode.Include, label: 'Inclusion' },
  { value: FilterMode.Exclude, label: 'Exclusion' },
];

const isValidKey = (key: string) => /^[a-zA-Z0-9_]+$/.test(key);

const isKeyUnique = (key: string) => {
  return !props.existingKeys.includes(key);
};

const canSaveGroup = computed(() => {
  return (
    editForm.value.key &&
    editForm.value.displayName &&
    isValidKey(editForm.value.key) &&
    (editForm.value.key === props.filterGroup.key ||
      isKeyUnique(editForm.value.key))
  );
});

const canAddOption = computed(() => {
  return (
    newOptionForm.value.value &&
    newOptionForm.value.displayName &&
    !props.filterGroup.options?.some(
      (option) => option.value === newOptionForm.value.value
    )
  );
});

const startEditing = () => {
  editForm.value = {
    key: props.filterGroup.key,
    displayName: props.filterGroup.displayName,
    mode: props.filterGroup.mode,
  };
  isEditing.value = true;
};

const saveGroup = () => {
  if (!canSaveGroup.value) return;

  emit('updateGroup', props.filterGroup.id, {
    key: editForm.value.key,
    displayName: editForm.value.displayName,
    mode: editForm.value.mode,
  });
  isEditing.value = false;
};

const cancelEditing = () => {
  editForm.value = {
    key: props.filterGroup.key,
    displayName: props.filterGroup.displayName,
    mode: props.filterGroup.mode,
  };
  isEditing.value = false;
};

const addOption = () => {
  if (!canAddOption.value) return;

  const newOption: FilterOption = {
    id: '', // Empty ID for new options - server will generate
    value: newOptionForm.value.value,
    displayName: newOptionForm.value.displayName,
    order: props.filterGroup.options?.length || 0,
    // Required fields for GraphQL type but not used in this context
    __typename: 'FilterOption' as const,
    group: props.filterGroup,
    groupAggregate: null,
    groupConnection: {} as any,
  };

  const updatedOptions = [...(props.filterGroup.options || []), newOption];
  emit('updateGroup', props.filterGroup.id, { options: updatedOptions });

  // Reset form
  newOptionForm.value = {
    value: '',
    displayName: '',
  };
  showNewOptionForm.value = false;
};

const removeOption = (optionId: string) => {
  const updatedOptions =
    props.filterGroup.options?.filter((option) => option.id !== optionId) || [];
  emit('updateGroup', props.filterGroup.id, { options: updatedOptions });
};

const moveOption = (optionId: string, direction: 'up' | 'down') => {
  const options = [...(props.filterGroup.options || [])];
  const index = options.findIndex((option) => option.id === optionId);

  if (index === -1) return;

  if (direction === 'up' && index > 0) {
    [options[index], options[index - 1]] = [options[index - 1], options[index]];
  } else if (direction === 'down' && index < options.length - 1) {
    [options[index], options[index + 1]] = [options[index + 1], options[index]];
  }

  // Update order values
  const orderedOptions = options.map((option, i) => ({ ...option, order: i }));
  emit('updateGroup', props.filterGroup.id, { options: orderedOptions });
};
</script>

<template>
  <div class="space-y-4">
    <!-- Group Header -->
    <div class="flex items-center justify-between">
      <h5 class="text-md font-medium text-gray-900 dark:text-white">
        Group #{{ groupIndex }}
      </h5>
      <div class="flex space-x-2">
        <button
          v-if="canMoveUp"
          type="button"
          class="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          :disabled="disabled"
          @click="$emit('moveGroup', filterGroup.id, 'up')"
        >
          ↑ Move Up
        </button>
        <button
          v-if="canMoveDown"
          type="button"
          class="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          :disabled="disabled"
          @click="$emit('moveGroup', filterGroup.id, 'down')"
        >
          ↓ Move Down
        </button>
        <button
          type="button"
          class="rounded border border-red-300 bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-700 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
          :disabled="disabled"
          @click="$emit('removeGroup', filterGroup.id)"
        >
          Remove Group
        </button>
      </div>
    </div>

    <!-- Group Settings -->
    <div v-if="!isEditing" class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Group Type
        </label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">
          {{
            filterModeOptions.find((opt) => opt.value === filterGroup.mode)
              ?.label
          }}
        </p>
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Computer-Friendly Key
        </label>
        <p class="mt-1 font-mono text-sm text-gray-900 dark:text-white">
          {{ filterGroup.key }}
        </p>
      </div>
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Display Name
        </label>
        <p class="mt-1 text-sm text-gray-900 dark:text-white">
          {{ filterGroup.displayName }}
        </p>
      </div>
    </div>

    <!-- Edit Group Form -->
    <div v-else class="space-y-3">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Group Type
          </label>
          <select
            v-model="editForm.mode"
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
            v-model="editForm.key"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            :class="{
              'border-red-500':
                editForm.key &&
                (!isValidKey(editForm.key) ||
                  (editForm.key !== filterGroup.key &&
                    !isKeyUnique(editForm.key))),
            }"
          >
          <p
            v-if="editForm.key && !isValidKey(editForm.key)"
            class="mt-1 text-xs text-red-500"
          >
            Key can only contain letters, numbers, and underscores.
          </p>
          <p
            v-if="
              editForm.key &&
              isValidKey(editForm.key) &&
              editForm.key !== filterGroup.key &&
              !isKeyUnique(editForm.key)
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
            v-model="editForm.displayName"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
        </div>
      </div>
      <div class="flex space-x-3">
        <button
          type="button"
          class="border-transparent rounded-md border bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSaveGroup"
          @click="saveGroup"
        >
          Save Changes
        </button>
        <button
          type="button"
          class="hover:bg-gray-50 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
          @click="cancelEditing"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Edit Button -->
    <div v-if="!isEditing" class="flex justify-start">
      <button
        type="button"
        class="rounded-md border border-blue-300 bg-blue-100 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
        :disabled="disabled"
        @click="startEditing"
      >
        Edit Group Settings
      </button>
    </div>

    <!-- Options Section -->
    <div class="border-t border-gray-200 pt-4 dark:border-gray-600">
      <div class="mb-3 flex items-center justify-between">
        <h6 class="text-sm font-medium text-gray-900 dark:text-white">
          Options in this Group
        </h6>
        <button
          v-if="!showNewOptionForm"
          type="button"
          class="border-transparent rounded border bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="disabled"
          @click="showNewOptionForm = true"
        >
          + Add New Option
        </button>
      </div>

      <!-- New Option Form -->
      <div
        v-if="showNewOptionForm"
        class="bg-gray-50 mb-3 rounded border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700"
      >
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label
              class="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Option Value
            </label>
            <input
              v-model="newOptionForm.value"
              type="text"
              placeholder="e.g. 10x20"
              class="mt-1 block w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
              :class="{
                'border-red-500':
                  newOptionForm.value &&
                  filterGroup.options?.some(
                    (option) => option.value === newOptionForm.value
                  ),
              }"
            >
            <p
              v-if="
                newOptionForm.value &&
                filterGroup.options?.some(
                  (option) => option.value === newOptionForm.value
                )
              "
              class="mt-1 text-xs text-red-500"
            >
              This value already exists in this group.
            </p>
          </div>
          <div>
            <label
              class="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Display Name
            </label>
            <input
              v-model="newOptionForm.displayName"
              type="text"
              placeholder="e.g. 10 × 20"
              class="mt-1 block w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
            >
          </div>
        </div>
        <div class="mt-3 flex space-x-2">
          <button
            type="button"
            class="border-transparent rounded border bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canAddOption"
            @click="addOption"
          >
            Add Option
          </button>
          <button
            type="button"
            class="hover:bg-gray-50 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700"
            @click="showNewOptionForm = false"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Existing Options -->
      <div
        v-if="filterGroup.options && filterGroup.options.length > 0"
        class="space-y-2"
      >
        <div
          v-for="(option, optionIndex) in filterGroup.options"
          :key="option.id"
          class="flex items-center justify-between rounded border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
        >
          <div class="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >Option Value:</span
              >
              <span
                class="ml-1 font-mono text-sm text-gray-900 dark:text-white"
                >{{ option.value }}</span
              >
            </div>
            <div>
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >Display:</span
              >
              <span class="ml-1 text-sm text-gray-900 dark:text-white">{{
                option.displayName
              }}</span>
            </div>
          </div>
          <div class="ml-4 flex space-x-1">
            <button
              v-if="optionIndex > 0"
              type="button"
              class="px-1 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              :disabled="disabled"
              title="Move up"
              @click="moveOption(option.id, 'up')"
            >
              ↑
            </button>
            <button
              v-if="optionIndex < (filterGroup.options?.length || 0) - 1"
              type="button"
              class="px-1 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              :disabled="disabled"
              title="Move down"
              @click="moveOption(option.id, 'down')"
            >
              ↓
            </button>
            <button
              type="button"
              class="rounded border border-red-300 bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-700 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
              :disabled="disabled"
              @click="removeOption(option.id)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Empty Options State -->
      <div
        v-else-if="!showNewOptionForm"
        class="py-4 text-center text-sm text-gray-500 dark:text-gray-400"
      >
        No options configured. Add an option above.
      </div>
    </div>
  </div>
</template>
