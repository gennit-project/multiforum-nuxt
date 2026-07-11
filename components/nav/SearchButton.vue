<script lang="ts" setup>
import SearchIcon from '@/components/icons/SearchIcon.vue';
</script>

<template>
  <button
    type="button"
    aria-label="Search"
    data-testid="create-anything-button"
    class="font-semibold flex h-8 items-center rounded-md border bg-white px-2 text-sm text-black hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-black dark:text-white dark:hover:bg-gray-600"
  >
    <SearchIcon class="h-3 w-3" aria-hidden="true" />
  </button>
</template>
