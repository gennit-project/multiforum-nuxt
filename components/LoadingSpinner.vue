<script lang="ts" setup>
// role="status" makes the spinner announce its label to assistive tech when
// it appears. Callers that already provide their own status text (e.g.
// SaveStatus) pass aria-hidden="true", which falls through to the root and
// suppresses the redundant announcement.
defineProps({
  label: {
    type: String,
    default: 'Loading…',
  },
});
</script>

<template>
  <div
    role="status"
    class="flex items-center justify-center space-x-2 dark:text-gray-200"
  >
    <svg
      class="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="4"
      aria-hidden="true"
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
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<style scoped>
.animate-spin {
  animation-duration: 1s;
}
</style>
