<script setup lang="ts">
  import { useRouter } from "nuxt/app";

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
    class="inline-flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium focus:outline-none focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-100"
    :class="[
      disabled
        ? 'cursor-default bg-gray-200 text-gray-600'
        : 'text-white-700 w-full rounded-md hover:bg-gray-200 dark:bg-orange-700 dark:text-white dark:hover:bg-orange-600',
      'dark:bg-opacity-60',
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />{{ label }}
  </button>
</template>
