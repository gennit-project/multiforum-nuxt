<script setup lang="ts">
import { computed, ref } from 'vue';

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
const inputRef = ref<HTMLInputElement | null>(null);

const handleChange = (event: Event) => {
  const inputElement = event.target as HTMLInputElement;
  emit('update', inputElement.value);
};

<<<<<<< HEAD
  // Styles derived from the existing component
  const baseStyles = computed(() => {
    return [
      "border cursor-pointer rounded border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500 w-full sm:w-36 h-10",
      "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]",
      props.disabled ? "opacity-60 cursor-not-allowed" : "",
    ].join(" ");
  });
=======
// Styles derived from the existing component
const baseStyles = computed(() => {
  return [
    'border cursor-pointer rounded border-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 w-full sm:w-36 h-10',
    'dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:[color-scheme:dark]',
    props.disabled ? 'opacity-60 cursor-not-allowed' : ''
  ].join(' ');
});
>>>>>>> parent of 666ae3d (Use automated formatting tools)
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
<<<<<<< HEAD
      :class="baseStyles"
=======
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      :data-testid="testId"
      :class="baseStyles"
      type="date"
      :value="value"
<<<<<<< HEAD
      style="color-scheme: light dark"
=======
      :disabled="disabled"
      class="[color-scheme:light_dark] dark:[&::-webkit-calendar-picker-indicator]:filter-invert-[0.8]"
>>>>>>> parent of 666ae3d (Use automated formatting tools)
      @input="handleChange"
    >
    <!-- Using only the native calendar icon -->
  </div>
</template>