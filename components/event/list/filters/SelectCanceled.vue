<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  showCanceled: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['updateShowCanceled']);

const copyOfShowCanceled = ref(props.showCanceled);

const toggleCanceled = () => {
  copyOfShowCanceled.value = !copyOfShowCanceled.value;
  emit('updateShowCanceled', copyOfShowCanceled.value);
};
</script>
<template>
  <label
    for="canceled-checkbox"
    class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-600"
  >
    <input
      id="canceled-checkbox"
      type="checkbox"
      :data-testid="'canceled-checkbox'"
      class="text-brand-600 focus:ring-brand-500 h-4 !min-h-4 w-4 shrink-0 rounded border border-gray-400"
      :checked="copyOfShowCanceled"
      @input="() => toggleCanceled()"
    />
    <span>Include canceled events</span>
  </label>
</template>
