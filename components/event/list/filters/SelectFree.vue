<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  showOnlyFree: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['updateShowOnlyFree']);

const copyOfShowOnlyFree = ref(props.showOnlyFree);

const toggleShowOnlyFree = () => {
  copyOfShowOnlyFree.value = !copyOfShowOnlyFree.value;
  emit('updateShowOnlyFree', copyOfShowOnlyFree.value);
};
</script>
<template>
  <label
    for="free-checkbox"
    class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-600"
  >
    <input
      id="free-checkbox"
      type="checkbox"
      :data-testid="'free-checkbox'"
      class="text-brand-600 focus:ring-brand-500 h-4 !min-h-4 w-4 shrink-0 rounded border border-gray-400"
      :checked="copyOfShowOnlyFree"
      @input="() => toggleShowOnlyFree()"
    />
    <span>Show only free events</span>
  </label>
</template>
