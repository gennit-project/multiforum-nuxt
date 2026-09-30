<script setup lang="ts">
import { useRouter } from 'nuxt/app';
const router = useRouter();
</script>

<template>
  <button
    type="button"
    class="focus:ring-brand-500 dark:focus:ring-brand-400 mt-2 inline-flex items-center rounded p-4 py-1.5 text-xs font-medium text-gray-500 shadow hover:text-gray-800 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:text-gray-300 dark:hover:text-white dark:focus:ring-offset-gray-900"
    @click="router.go(-1)"
  >
    ← Back
  </button>
</template>
