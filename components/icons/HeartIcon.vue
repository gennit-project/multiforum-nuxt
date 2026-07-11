<script setup lang="ts">
defineProps({
  filled: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <svg aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    :fill="filled ? 'currentColor' : 'none'"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="1.5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M21.435 6.582a5.373 5.373 0 00-7.6 0L12 8.416l-1.835-1.834a5.373 5.373 0 10-7.6 7.6l1.835 1.834L12 23.18l7.765-7.164 1.67-1.834a5.373 5.373 0 000-7.6z"
    />
  </svg>
</template>
