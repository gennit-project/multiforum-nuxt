<script setup lang="ts">
import { useRouter } from 'vue-router';

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
});

const router = useRouter();

const handleClick = () => {
  if (!props.disabled) {
    router.push(props.to);
  }
};
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-600'
        : 'text-white-700 w-full dark:text-white rounded-md hover:bg-gray-200 dark:bg-blue-700 dark:hover:bg-blue-600',
      'dark:bg-opacity-60',
    ]"
    class="font-medium inline-flex items-center whitespace-nowrap px-4 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100"
    @click="handleClick"
  >
    <slot />{{ label }}
  </button>
</template>
