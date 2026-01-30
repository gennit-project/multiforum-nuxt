<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  checked: {
    type: Boolean,
    default: false,
  },
  // Accessibility props
  label: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  testId: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update']);

// Generate a unique ID if not provided
const checkboxId = computed(() => {
  if (props.id) return props.id;
  if (props.testId) return `checkbox-${props.testId}`;
  return `checkbox-${Math.random().toString(36).substr(2, 9)}`;
});

// Use ariaLabel if provided, otherwise fall back to label
const accessibleLabel = computed(() => {
  return props.ariaLabel || props.label || undefined;
});

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update', target.checked);
};
</script>

<template>
  <div class="flex items-center" :class="{ 'gap-2': label }">
    <input
      :id="checkboxId"
      type="checkbox"
      :class="[disabled ? 'text-orange-200' : 'text-orange-600']"
      class="h-4 w-4 rounded border border-gray-500 focus:ring-orange-500 dark:border-gray-400 dark:bg-gray-800 dark:focus:ring-orange-500"
      :checked="checked"
      :disabled="disabled"
      :aria-label="!label ? accessibleLabel : undefined"
      :data-testid="testId"
      @change="handleChange"
    >
    <label
      v-if="label"
      :for="checkboxId"
      class="text-sm text-gray-700 dark:text-gray-300"
      :class="{ 'text-gray-400 dark:text-gray-500': disabled }"
    >
      {{ label }}
    </label>
  </div>
</template>
