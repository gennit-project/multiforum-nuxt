<script setup lang="ts">
import { useRouter } from 'nuxt/app';

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
        ? 'cursor-default bg-gray-200 text-gray-600 dark:bg-gray-200/60'
        : 'text-white-700 w-full rounded-md hover:bg-gray-200 dark:bg-orange-700/60 dark:text-white dark:hover:bg-orange-600/60',
    ]"
    class="inline-flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100 focus:outline-none"
    @click="handleClick"
  >
    <slot />{{ label }}
  </button>
</template>
