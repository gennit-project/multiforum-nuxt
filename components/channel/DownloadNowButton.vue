<script setup lang="ts">
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const buttonBaseClasses =
  'max-height-4 inline-flex w-full items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-offset-2 focus:ring-offset-gray-100';

const activeDownloadButtonClasses = `${buttonBaseClasses} bg-orange-400 hover:bg-orange-400 focus:ring-orange-500 dark:border dark:border-orange-500 dark:bg-orange-400 dark:text-black dark:hover:bg-orange-400`;

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
    Download Now
  </button>
</template>
