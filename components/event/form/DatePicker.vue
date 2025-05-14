<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: String,
    required: true
  },
  testId: {
    type: String,
    default: 'date-picker'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update']);

const handleChange = (event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  emit('update', inputElement.value);
};

// Styles derived from the existing component
const baseStyles = computed(() => {
  return [
    'border mt-2 cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 w-36 h-10',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]',
    props.disabled ? 'opacity-60 cursor-not-allowed' : ''
  ].join(' ');
});
</script>

<template>
  <div class="relative">
    <input
      :data-testid="testId"
      :class="baseStyles"
      type="date"
      :value="value"
      :disabled="disabled"
      class="[color-scheme:light_dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:filter-invert-[0.8]"
      @click="(event) => !disabled && (event.target as HTMLInputElement).showPicker()"
      @input="handleChange"
    >
    <!-- Calendar icon -->
    <div class="absolute right-4 mt-1 top-1/2 transform -translate-y-1/2 pointer-events-none">
      <i class="far fa-calendar-alt text-gray-500 dark:text-gray-400"/>
    </div>
  </div>
</template>