<script lang="ts" setup>

</script>

<template>
  <div class="flex items-center justify-center space-x-2 dark:text-gray-200">
    <svg
      class="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
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