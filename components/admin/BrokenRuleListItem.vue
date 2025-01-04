<script lang="ts" setup>
import type { PropType } from "vue";

type RuleOption = {
  summary: string;
  detail: string;
};

const props = defineProps({
  rule: {
    type: Object as () => RuleOption,
    required: true,
  },
  selected: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(["toggleSelection"]);
</script>

<template>
  <label class="flex cursor-pointer items-center space-x-3 py-2">
    <input
      type="checkbox"
      :value="rule.summary"
      :checked="selected.includes(rule.summary)"
      class="border border-gray-300 text-blue-600 dark:border-gray-600"
      @change="() => emit('toggleSelection', rule.summary)"
    >
    <div class="flex items-center space-x-2 flex-col text-sm">
   
        <span
          v-if="rule.summary"
          :data-testid="`forum-picker-${rule.summary}`"
        >
          {{ rule.summary }}
        </span>
      </div>
  </label>
</template>
