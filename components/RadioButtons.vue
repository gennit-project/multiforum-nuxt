<script setup lang="ts">
import type { PropType } from "vue";

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
});

const emit = defineEmits(["updateSelected"]);


</script>

<template>
  <form>
    <fieldset>
      <div
        v-for="option in props.options"
        :key="option.label"
        class="flex items-center mt-4"
      >
        <input
          name="showBothVirtualAndInPerson"
          type="radio"
          :checked="selectedOption.value === option.value"
          class="focus:ring-orange-500 h-4 w-4 text-orange-600 border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          @input="
            () => {
              emit('updateSelected', option);
            }
          "
        >
        <label class="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ option.label }}
        </label>
      </div>
    </fieldset>
  </form>
</template>
