<script setup lang="ts">
import { ref } from 'vue';

export type EventEditScope = 'THIS_ONLY' | 'THIS_AND_FUTURE' | 'ALL_IN_SERIES';

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  eventTitle: {
    type: String,
    default: 'this event',
  },
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', scope: EventEditScope): void;
}>();

const selectedScope = ref<EventEditScope>('THIS_ONLY');

const scopeOptions = [
  {
    value: 'THIS_ONLY' as EventEditScope,
    label: 'This event only',
    description: 'Changes will only apply to this occurrence',
  },
  {
    value: 'THIS_AND_FUTURE' as EventEditScope,
    label: 'This and following events',
    description: 'Changes will apply to this and all future occurrences',
  },
  {
    value: 'ALL_IN_SERIES' as EventEditScope,
    label: 'All events in series',
    description: 'Changes will apply to all occurrences in the series',
  },
];

const handleConfirm = () => {
  emit('confirm', selectedScope.value);
};

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-scope-title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="handleClose"
      />

      <!-- Modal -->
      <div
        class="relative z-10 mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h2
          id="edit-scope-title"
          class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
        >
          Edit recurring event
        </h2>

        <p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
          This event is part of a series. How would you like to apply your changes?
        </p>

        <!-- Scope options -->
        <div class="space-y-3" role="radiogroup" aria-label="Edit scope">
          <label
            v-for="option in scopeOptions"
            :key="option.value"
            :class="[
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
              selectedScope === option.value
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600',
            ]"
            :data-testid="`edit-scope-${option.value.toLowerCase().replace(/_/g, '-')}`"
          >
            <input
              v-model="selectedScope"
              type="radio"
              name="edit-scope"
              :value="option.value"
              class="mt-1 h-4 w-4 border-gray-300 text-orange-500 focus:ring-orange-500"
            >
            <div class="flex-1">
              <span class="block font-medium text-gray-900 dark:text-white">
                {{ option.label }}
              </span>
              <span class="block text-sm text-gray-500 dark:text-gray-400">
                {{ option.description }}
              </span>
            </div>
          </label>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            data-testid="edit-scope-cancel"
            @click="handleClose"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            data-testid="edit-scope-confirm"
            @click="handleConfirm"
          >
            Apply changes
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
