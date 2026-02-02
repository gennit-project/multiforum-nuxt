<script lang="ts" setup>
import { type PropType, ref } from 'vue';

type RuleOption = {
  summary: string;
  detail: string;
};

defineProps({
  rule: {
    type: Object as () => RuleOption,
    required: true,
  },
  selected: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const expanded = ref(false);

const emit = defineEmits(['toggleSelection']);
const toggleExpandDetail = () => {
  expanded.value = !expanded.value;
};
</script>

<template>
  <label class="flex cursor-pointer items-start space-x-3 py-2">
    <input
      type="checkbox"
      :value="rule.summary"
      :checked="selected.includes(rule.summary)"
      :aria-label="`Select rule: ${rule.summary}`"
      class="mt-1 border border-gray-300 text-orange-600 dark:border-gray-600"
      @change="() => emit('toggleSelection', rule.summary)"
    >
    <div class="flex flex-col text-sm">
      <!-- Summary and See More (inline and wrapping) -->
      <div class="flex flex-wrap items-center gap-x-2">
        <span v-if="rule.summary" :data-testid="`forum-picker-${rule.summary}`">
          {{ rule.summary }}
        </span>
        <span
          v-if="rule.detail"
          class="cursor-pointer text-gray-500 dark:text-gray-400"
          :data-testid="`forum-picker-${rule.detail}`"
          @click="toggleExpandDetail"
        >
          {{ expanded ? 'See Less' : 'See More' }}
        </span>
      </div>

      <!-- Detail (block below) -->
      <div
        v-if="expanded"
        class="mt-1 text-gray-500 dark:text-gray-400"
        :data-testid="`forum-picker-${rule.detail}`"
      >
        <MarkdownRenderer
          v-if="rule.detail"
          :text="rule.detail"
          class="w-full"
        />
      </div>
    </div>
  </label>
</template>
