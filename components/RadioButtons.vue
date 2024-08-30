<script setup lang="ts">
import { ref, watch } from "vue";
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

const selected = ref<Option>(props.selectedOption);

watch(
  () => props.selectedOption,
  (newValue) => {
    selected.value = newValue;
  }
);
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
          :checked="selected.value === option.value"
          class="focus:ring-blue-500 h-4 w-4 text-blue-600 border border-gray-300"
          @input="
            () => {
              emit('updateSelected', option);
              selected = option
            }
          "
        >
        <label class="ml-3 block text-sm font-medium text-gray-700">
          {{ option.label }}
        </label>
      </div>
    </fieldset>
  </form>
</template>
