<script lang="ts" setup></script>

<template>
  <div class="flex items-center justify-center space-x-2 dark:text-gray-200">
    <svg
      class="h-4 w-4 animate-spin"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke-dasharray="42"
        stroke-dashoffset="12"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<style scoped>
  .animate-spin {
    animation-duration: 1s;
  }
</style>
