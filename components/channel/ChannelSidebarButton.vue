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
        : 'text-white-700 dark:bg-brand-700/60 dark:hover:bg-brand-600/60 w-full rounded-md hover:bg-gray-200 dark:text-white',
    ]"
    class="focus:ring-brand-500 inline-flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap focus:ring-offset-2 focus:ring-offset-gray-100 focus:outline-none"
    @click="handleClick"
  >
    <slot />{{ label }}
  </button>
</template>
