<script setup lang="ts">
defineProps({
  class: {
    type: String,
    default: "h-6 w-6",
  },
});
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :class="class"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 4v16m-6-10h12M8 16h8"
    />
  </svg>
</template>