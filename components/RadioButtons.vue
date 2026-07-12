<script setup lang="ts">
import { useId } from 'vue';
import type { PropType } from 'vue';

type Option = {
  label: string;
  value: string;
};

const props = defineProps({
  selectedOption: {
    type: Object as PropType<Option>,
    required: true,
  },
  options: {
    type: Array as PropType<Option[]>,
    required: true,
  },
  // Accessible name for the radio group, announced via <legend>.
  legend: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['updateSelected']);

// A unique group name keeps two instances on one page from merging into a
// single radio group, and namespaces the per-option input ids.
const groupId = useId();
</script>

<template>
  <form>
    <fieldset>
      <legend v-if="legend" class="sr-only">{{ legend }}</legend>
      <div
        v-for="option in props.options"
        :key="option.label"
        class="mt-4 flex items-center"
      >
        <input
          :id="`radio-${groupId}-${option.value}`"
          :name="`radio-group-${groupId}`"
          type="radio"
          :checked="selectedOption.value === option.value"
          class="h-4 w-4 border border-gray-300 text-orange-600 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700"
          @input="
            () => {
              emit('updateSelected', option);
            }
          "
        >
        <label
          :for="`radio-${groupId}-${option.value}`"
          class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ option.label }}
        </label>
      </div>
    </fieldset>
  </form>
</template>
