<script setup lang="ts">
defineProps({
  filled: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :fill="filled ? 'currentColor' : 'none'"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="1.5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321 1.01l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.386a.562.562 0 01-.84.61L12.28 18.03a.563.563 0 00-.56 0l-4.74 2.532a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-1.01l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
    />
  </svg>
</template>
