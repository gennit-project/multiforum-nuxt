<script setup lang="ts">
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: 'Download Now',
  },
});

const buttonBaseClasses =
  'max-height-4 inline-flex w-full items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100';

const activeDownloadButtonClasses = `${buttonBaseClasses} bg-brand-400 hover:bg-brand-400 focus:ring-brand-500 dark:border dark:border-brand-500 dark:bg-brand-400 dark:text-black dark:hover:bg-brand-400`;

const disabledDownloadButtonClasses = `${buttonBaseClasses} cursor-default bg-gray-200 text-gray-300 dark:bg-gray-800 dark:text-gray-300`;
</script>

<template>
  <button
    type="button"
    :class="
      disabled ? disabledDownloadButtonClasses : activeDownloadButtonClasses
    "
    :disabled="disabled"
  >
    {{ label }}
  </button>
</template>
